from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.hash import bcrypt
from app.core.database import SessionLocal,get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.auth import RegisterRequest 
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from app.models.usuario import DimUsuario
from app.models.professor import DimProfessor

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

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
        
        return {
            "success": True,
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

        return {
            "success": True,
            "usuario": {
                "email": usuario.email,
                "nome": usuario.nome,
                "tipo": "aluno",
                "idusuario": usuario.idusuario
            }
        }


@router.post("/adicionar-usuario")
async def adicionar_usuario(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
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
        datanasc=data.datanasc,
        dataentrada=data.dataentrada,
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