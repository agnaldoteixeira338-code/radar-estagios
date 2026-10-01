"""Perfil do candidato usado no cálculo de compatibilidade.

Mude aqui quando aprender uma tecnologia nova ou quando seus dados mudarem.
Cada habilidade tem: nome exibido, padrão de busca no texto (regex) e peso em pontos.
"""

from __future__ import annotations

FORMATURA = (2028, 1)  # (ano, mês) da previsão de formatura
NIVEL_INGLES = "intermediario"  # basico | intermediario | avancado | fluente
MODALIDADES_PREFERIDAS = {"presencial", "hibrido"}

# Habilidades que você TEM. Aparecer na vaga soma pontos.
HABILIDADES = [
    ("React", r"\breact(\.?js)?\b(?!\s*native)", 10),
    ("Node.js", r"\bnode(\.?js)?\b", 10),
    ("JavaScript", r"\bjavascript\b|\bjs\b", 8),
    ("SQL", r"\bsql\b", 8),
    ("APIs REST", r"\bapis?\b|\brest(ful)?\b", 8),
    ("Python", r"\bpython\b", 8),
    ("Full Stack", r"\bfull[\s-]?stack\b", 8),
    ("PostgreSQL", r"\bpostgre(s|sql)?\b", 6),
    ("Banco de dados", r"bancos? de dados|\bdatabase", 5),
    ("Front-end", r"\bfront[\s-]?end\b", 5),
    ("Back-end", r"\bback[\s-]?end\b", 5),
    (
        "Automação",
        r"automa[cç][aã]o (de |das? |dos? )?(rotinas|processos|atividades|tarefas|fluxos|workflows)"
        r"|iniciativas de automa[cç][aã]o|automatizar (processos|rotinas|tarefas)"
        r"|\bn8n\b|\bmake\.com\b|\brpa\b",
        5,
    ),
    ("Express", r"\bexpress(\.?js)?\b", 4),
    ("Git", r"\bgit(hub)?\b", 4),
    ("HTML/CSS", r"\bhtml5?\b|\bcss3?\b", 4),
    ("Lógica de programação", r"l[oó]gica de programa[cç][aã]o", 3),
    ("JWT/Autenticação", r"\bjwt\b|autentica[cç][aã]o", 3),
    ("Figma", r"\bfigma\b", 2),
]

# Requisitos que você AINDA NÃO TEM. Obrigatórios tiram pontos; diferenciais só são listados.
LACUNAS = [
    ("Java", r"\bjava\b(?!\s*script)"),
    ("C#/.NET", r"\bc#|\.net\b|\bdotnet\b"),
    ("C/C++", r"\bc\s*/\s*c\s*\+\+|\bc\s*\+\+|\blinguage(m|ns) c\b"),
    ("TypeScript", r"\btypescript\b"),
    ("Kotlin", r"\bkotlin\b"),
    ("Angular", r"\bangular\b"),
    ("Vue", r"\bvue(\.?js)?\b"),
    ("React Native/Flutter", r"react\s*native|\bflutter\b"),
    ("PHP", r"\bphp\b"),
    ("Docker", r"\bdocker\b"),
    ("Cloud (AWS/Azure/GCP)", r"\baws\b|\bazure\b|\bgcp\b|google cloud"),
    ("Linux", r"\blinux\b"),
    ("Power BI", r"power\s*bi"),
]
