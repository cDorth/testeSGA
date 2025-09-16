document.addEventListener("DOMContentLoaded", () => {
    const filtrarButton = document.querySelector("#filtrar");
    const caixote = document.querySelector("#caixote");

    //mostrar ou esconder o caixote
    filtrarButton.addEventListener("click", (event) => {
        caixote.classList.toggle("active");
        event.stopPropagation(); // impede que o click no filtro feche o dropdown
    });

    // Fecha o caixote se clicar fora dele
    document.addEventListener("click", (event) => {
        if (!caixote.contains(event.target) && !filtrarButton.contains(event.target)) {
            caixote.classList.remove("active");
        }
    });
});

//----------SCRIPT PRINCIPAL

produtos = []

const tabelaOpts = {
  categoria: '',
  fabricante: '',
  ordenacao: ''
};

document.getElementById('foto').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const preview = document.getElementById('preview-foto');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    } else {
        preview.src = "";
        preview.style.display = 'none';
    }
});

document.addEventListener('click', async function(e) {
    const popupEdicao = document.querySelector('.popup-edicao');
    const content = document.querySelector('.popup-edicao .conteudo');

    // Fecha o popup se clicar fora
    if (popupEdicao && !content.contains(e.target)) {
        popupEdicao.style.display = 'none';
    }

    // Clique no lápis
    const lapis = e.target.closest('.imagemlapis');
    if (lapis) {
        const codigo = lapis.dataset.codigo;
        if (!codigo) {
            alert("Código do produto não encontrado.");
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/ver_produtos/${codigo}`);
            if (!response.ok) throw new Error("Erro ao carregar produto");

            const produto = await response.json();

            // Preenche os campos do popup
            document.getElementById('cod').value = produto.codigo || "";
            document.getElementById('nome_b').value = produto.nome_basico || "";
            document.getElementById('nome_m').value = produto.nome_modificador || "";
            document.getElementById('descricao').value = produto.descricao_tecnica || "";
            document.getElementById('fabricante').value = produto.fabricante || "";
            document.getElementById('observacao').value = produto.observacoes_adicional || "";
            document.getElementById('unidade').value = produto.unidade || "";
            document.getElementById('preco_v').value = produto.preco_de_venda || "";
            document.getElementById('altura').value = produto.altura || "";
            document.getElementById('largura').value = produto.largura || "";
            document.getElementById('profundidade').value = produto.profundidade || "";
            document.getElementById('peso').value = produto.peso || "";
            document.getElementById('rua').value = produto.rua || "";
            document.getElementById('coluna').value = produto.coluna || "";
            document.getElementById('andar').value = produto.andar || "";
            document.getElementById('preview-foto').src = produto.imagem ? `data:image/png;base64,${produto.imagem}` : "";

            document.getElementById('fragilidade-sim').checked = produto.fragilidade == 1;
            document.getElementById('fragilidade-nao').checked = produto.fragilidade != 1;

            popupEdicao.style.display = 'flex';

        } catch (error) {
            console.error(error);
            alert("Erro ao carregar produto.");
        }
    }
});

// -------- ENVIAR OS DADOS
document.querySelector('.salvar_edicao').addEventListener('click', async function () {
    const codigo = document.getElementById('cod').value.trim();
    if (!codigo) return alert("Código do produto não encontrado.");

    const formData = new FormData();
    formData.append("codigo", codigo);
    formData.append("nome_basico", document.getElementById('nome_b').value.trim());
    formData.append("nome_modificador", document.getElementById('nome_m').value.trim());
    formData.append("descricao_tecnica", document.getElementById('descricao').value.trim());
    formData.append("fabricante", document.getElementById('fabricante').value.trim());
    formData.append("observacoes_adicional", document.getElementById('observacao').value.trim());
    formData.append("unidade", document.getElementById('unidade').value.trim());
    formData.append("preco_de_venda", document.getElementById('preco_v').value.trim());
    formData.append("fragilidade", document.getElementById('fragilidade-sim').checked ? 1 : 0);
    formData.append("altura", document.getElementById('altura').value.trim());
    formData.append("largura", document.getElementById('largura').value.trim());
    formData.append("profundidade", document.getElementById('profundidade').value.trim());
    formData.append("peso", document.getElementById('peso').value.trim());
    formData.append("rua", document.getElementById('rua').value.trim());
    formData.append("coluna", document.getElementById('coluna').value.trim());
    formData.append("andar", document.getElementById('andar').value.trim());

    const foto = document.getElementById('foto').files[0];
    if (foto) formData.append("imagem", foto);

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/editar_produto/${codigo}`, {
            method: "PATCH",
            body: formData
        });

        if (response.ok) {
            alert("Produto atualizado com sucesso!");
            location.reload();
        } else {
            const text = await response.text();
            console.error("Erro:", response.status, text);
            alert("Erro ao atualizar produto.");
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao enviar dados.");
    }
});

// <!-- -------------------------------------Mostrar a Tabela----------------------------------------------------------- -->

let API_URL = "http://127.0.0.1:8000/api/ver_produtos" 

async function fetchProdutosCatalogo() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('Erro ao buscar produtos: ' + response.statusText);
        }

        produtos = await response.json();

        preencherSelectFabricantes(produtos)
        montarTabela(produtos)
    } catch (error) {
        alert('Erro ao buscar produtos: ' + error.message);
    }
}

function montarTabela(lista = produtos){
    const tbody = document.querySelector('#tabela-estoque tbody');
    tbody.innerHTML = '';

    let dados = lista.slice();
    console.log(dados)

    dados.sort((a, b) => a.nome_basico.localeCompare(b.nome_basico));

    if (tabelaOpts.categoria) {
        dados = dados.filter(p => p.categorias && p.categorias.includes(tabelaOpts.categoria));
    }
    if (tabelaOpts.fabricante) {
        dados = dados.filter(p => p.fabricante === tabelaOpts.fabricante);
    }

    if (tabelaOpts.ordenacao === 'az') {
        dados.sort((a, b) => a.nome_basico.localeCompare(b.nome_basico));
    } else if (tabelaOpts.ordenacao === 'za') {
        dados.sort((a, b) => b.nome_basico.localeCompare(a.nome_basico));
    }

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhum produtos encontrado</td></tr>';
        return;
    }

    dados.forEach(p => {
        const row = `
            <tr id="produto-${p.codigo}">
                    <td>${p.codigo}</td>
                    <td>${p.nome_basico}</td>
                    <td>${p.nome_modificador}</td>
                    <td>${p.descricao_tecnica}</td>
                    <td>${p.fabricante}</td>
                    <td class="none">${p.observacoes_adicional}</td>
                    <td class="none">${p.unidade}</td>
                    <td class="none">${p.preco_de_venda}</td>
                    <td class="none">${p.fragilidade}</td>
                    <td class="none">${p.altura}</td>
                    <td class="none">${p.largura}</td>
                    <td class="none">${p.profundidade}</td>
                    <td class="none">${p.peso}</td>
                    <td class="none">${p.rua}</td>
                    <td class="none">${p.coluna}</td>
                    <td class="none">${p.andar}</td>
                    <td class="none">${p.imagem}</td>
                    <td class="lixeira">
                        <img src="imagens/Lixeira(Normal).svg" alt="Lixeira" class="imagemlixeira" 
                            onmouseover="this.src='imagens/Lixeira(Modificado).svg';" 
                            onmouseout="this.src='imagens/Lixeira(Normal).svg';" 
                            onclick="excluirProduto(${p.codigo})">
                    </td>
                    <td class="lapis">
                        <img 
                            src="imagens/Lapis(Normal).svg" 
                            alt="Lápis" 
                            class="imagemlapis" 
                            data-codigo="${p.codigo}"
                            onmouseover="this.src='imagens/Lapis(Modificado).svg';" 
                            onmouseout="this.src='imagens/Lapis(Normal).svg';">
                    </td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

function preencherSelectFabricantes(lista) {
    const selectFabricante = document.getElementById("fabricante-filtro");
    selectFabricante.innerHTML = '<option value="">Todos</option>';

    const fabricantes = [...new Set(lista.map(p => p.fabricante))].filter(f => f);

    fabricantes.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f;
        opt.textContent = f;
        selectFabricante.appendChild(opt);
    });
}

// <!-- ------------------------------------- Deletar ----------------------------------------------------------- -->

function excluirProduto(codigo) {
    codigo_deletar = codigo;  // Salva o código do produto a ser excluído
    document.getElementById('senha-popup').style.display = 'flex';  // Exibe o pop-up
    console.log(codigo)
}

function verificarSenha() {
    const senha = document.getElementById('senha-input').value;

    if (senha !== 'professor123') {
        alert('Senha incorreta!');
        return;
    }

    fetch(`http://127.0.0.1:8000/api/deletar_produto/${codigo_deletar}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao excluir produto");
            }
            return response.text();
        })
        .then(message => {  
            console.log(`${message}, DELETADO COM SUCESSO`);
            fetchProdutosCatalogo();
            if (message.includes('sucesso')) {
                document.querySelector(`#produto-${codigo_deletar}`).remove();
                fetchProdutosCatalogo();
            } 
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao excluir produto');
        });

    // Fecha o pop-up
    cancelarSenha();
}

function cancelarSenha() {
    document.getElementById('senha-popup').style.display = 'none';
    document.getElementById('senha-input').value = '';  // Limpa o campo da senha
}

document.getElementById('ordenacao').addEventListener('change', e => {
  tabelaOpts.ordenacao = e.target.value;
  montarTabela();
});

document.getElementById('fabricante-filtro').addEventListener('change', e => {
  tabelaOpts.fabricante = e.target.value;
  montarTabela(produtos)
});

//---------------------LIMPAR FILTRO

function limparFiltros() {
  tabelaOpts.categoria = '';
  tabelaOpts.fabricante = '';
  tabelaOpts.ordenacao = '';
  document.getElementById('categoria').value = '';
  document.getElementById('fabricante').value = '';
  document.getElementById('ordenacao').value = '';
  montarTabela();
}


window.onload = fetchProdutosCatalogo;