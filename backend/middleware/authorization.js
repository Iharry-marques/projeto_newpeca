// backend/middleware/authorization.js
function ensureAdmin(req, res, next) {
    // ensureAuth já deve ter sido chamado antes, garantindo req.user
    if (req.user && req.user.role === 'admin') {
        return next(); // Usuário é admin, pode prosseguir
    }
    // Se não for admin, retorna erro 403 Forbidden
    res.status(403).json({ error: 'Acesso negado. Permissão de administrador necessária.' });
}

module.exports = { ensureAdmin };