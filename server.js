import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();

app.use(express.json());
const JWT_SECRET = "Avaliacao3_JWT_2026_Express_7f9c2d8a4b6e1f3c";
const users = [];

const alunos = [
  { id: 1, nome: 'Ana Souza', ra: 'SC3001', nota1: 7.5, nota2: 8.0 },
  { id: 2, nome: 'Bruno Lima', ra: 'SC3002', nota1: 4.0, nota2: 5.5 },
  { id: 3, nome: 'Carla Mendes', ra: 'SC3003', nota1: 6.0, nota2: 6.0 },
];

function buscaAluno(id) {
  return alunos.findIndex((aluno) => aluno.id === Number(id));
}

function calculaMedia(aluno) {
  return (aluno.nota1 + aluno.nota2) / 2;
}

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({ username, password: hashedPassword });

  res.status(201).json({ message: 'User registered' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((user) => user.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Login Incorreto!' });
  }

  const token = jwt.sign({ username: user.username }, JWT_SECRET, {
    expiresIn: '1h',
    algorithm: 'HS256',
  });

  res.json(token);
});

const authenticateJWT = (req, res, next) => {
  const authHeader = req.header('Authorization');

  let token;

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2) {
      token = parts[1];
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res
          .status(401)
          .json({ message: 'Acesso negado. Token expirado.' });
      } else {
        return res
          .status(403)
          .json({ message: 'Acesso negado. Token inválido.' });
      }
    }

    req.user = user;
    next();
  });
};

app.use(authenticateJWT);

app.get('/alunos', (req, res) => {
  res.status(200).json(alunos);
});

app.get('/alunos/medias', (req, res) => {
  const medias = alunos.map((aluno) => {
    return { nome: aluno.nome, media: calculaMedia(aluno) };
  });
  res.status(200).json(medias);
});

app.get('/alunos/aprovados', (req, res) => {
  const status = alunos.map((aluno) => {
    return {
      nome: aluno.nome,
      status: calculaMedia(aluno) >= 6 ? 'aprovado' : 'reprovado',
    };
  });
  res.status(200).json(status);
});

app.get('/alunos/:id', (req, res) => {
  const index = buscaAluno(req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Aluno não encontrado!' });
  }
  res.status(200).json(alunos[index]);
});

app.post('/alunos', (req, res) => {
  alunos.push(req.body);
  res.status(201).json(req.body);
});

app.put('/alunos/:id', (req, res) => {
  const index = buscaAluno(req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Aluno não encontrado!' });
  }
  alunos[index] = { ...alunos[index], ...req.body };
  res.status(200).json(alunos[index]);
});

app.delete('/alunos/:id', (req, res) => {
  const index = buscaAluno(req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Aluno não encontrado!' });
  }
  alunos.splice(index, 1);
  res.status(200).json({ message: 'Aluno removido!' });
});

app.listen(3000, () => {
  console.log('Servidor ativo e aguardando requisições...');
});
