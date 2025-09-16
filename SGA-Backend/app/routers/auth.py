from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.hash import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.database import SessionLocal,get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.auth import RegisterRequest 
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field

from app.models.usuario import DimUsuario
from app.models.professor import DimProfessor

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT Configuration
import os
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-key-for-dev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Usar schemas já definidos
# class LoginRequest e RegisterRequest já importados de app.schemas.auth

@router.post("/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = request.email
    senha = request.senha

    # Verificar se é professor (email contém @professor.com)
    if "@professor.com" in email:
        result_prof = await db.execute(select(DimProfessor).where(DimProfessor.email == email))
        professor = result_prof.scalars().first()
        
        if not professor or not bcrypt.verify(senha, professor.senha):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
        
        # Criar token JWT
        token_data = {
            "sub": professor.email,
            "nome": professor.nome,
            "tipo": "professor",
            "sn": professor.sn,
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "success": True,
            "access_token": token,
            "token_type": "bearer",
            "usuario": {
                "email": professor.email,
                "nome": professor.nome,
                "tipo": "professor",
                "sn": professor.sn
            }
        }
    else:
        # Verificar na tabela de usuários (alunos)
        result_user = await db.execute(select(DimUsuario).where(DimUsuario.email == email))
        usuario = result_user.scalars().first()

        if not usuario or not bcrypt.verify(senha, usuario.senha):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")

        # Criar token JWT
        token_data = {
            "sub": usuario.email,
            "nome": usuario.nome,
            "tipo": "aluno",
            "idusuario": usuario.idusuario,
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "success": True,
            "access_token": token,
            "token_type": "bearer",
            "usuario": {
                "email": usuario.email,
                "nome": usuario.nome,
                "tipo": "aluno",
                "idusuario": usuario.idusuario
            }
        }


# Função para verificar token JWT e extrair usuário
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Função para verificar se é professor
async def get_current_professor(current_user: dict = Depends(get_current_user)):
    if current_user.get("tipo") != "professor":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas professores podem adicionar usuários.")
    return current_user

@router.post("/adicionar-usuario")
async def adicionar_usuario(
    data: RegisterRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_professor)
):
    # 1. Verificar se o e-mail já existe
    query = select(DimUsuario).where(DimUsuario.email == data.email)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email já registrado.")

    # 2. Criar novo usuário com senha criptografada
    hashed_password = bcrypt.hash(data.senha)
    new_user = DimUsuario(
        nome=data.nome,
        email=data.email,
        senha=hashed_password,
        datanasc=data.dataNasc,
        dataentrada=data.dataEntrada,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {
        "success": True,
        "message": "Usuario adicionado com sucesso!",
        "usuario": {
            "idusuario": new_user.idusuario,
            "nome": new_user.nome,
            "email": new_user.email
        }
    }