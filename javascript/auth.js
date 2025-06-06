// javascript/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // Garanta que `auth` esteja disponível.
    // Se firebaseInit.js estiver carregado antes, 'auth' será global.
    if (typeof auth === 'undefined') {
        console.error('Firebase Auth não está inicializado. Verifique firebaseInit.js');
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');
    const registerEmailInput = document.getElementById('registerEmail');
    const registerPasswordInput = document.getElementById('registerPassword');
    const registerConfirmPasswordInput = document.getElementById('registerConfirmPassword');
    const registerBtn = document.getElementById('registerBtn');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const messageDiv = document.getElementById('message');

    // Função para exibir mensagens
    function showMessage(msg, type = 'error') {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`; // Usa suas classes de mensagem
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000); // Esconde a mensagem após 5 segundos
    }

    // Alternar entre formulário de login e cadastro
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        messageDiv.style.display = 'none'; // Limpa mensagens
        loginEmailInput.value = ''; // Limpa os campos ao trocar
        loginPasswordInput.value = '';
        registerEmailInput.value = '';
        registerPasswordInput.value = '';
        registerConfirmPasswordInput.value = '';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
        messageDiv.style.display = 'none'; // Limpa mensagens
        loginEmailInput.value = ''; // Limpa os campos ao trocar
        loginPasswordInput.value = '';
        registerEmailInput.value = '';
        registerPasswordInput.value = '';
        registerConfirmPasswordInput.value = '';
    });

    // Função de Cadastro
    registerBtn.addEventListener('click', async () => {
        const email = registerEmailInput.value.trim();
        const password = registerPasswordInput.value;
        const confirmPassword = registerConfirmPasswordInput.value;

        if (!email || !password || !confirmPassword) {
            showMessage('Por favor, preencha todos os campos.');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            registerBtn.disabled = true; // Desabilita o botão para evitar cliques múltiplos
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);

            // Salvar no Firebase
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                // Adicione outros campos que você queira armazenar para o usuário
                createdAt: firebase.firestore.FieldValue.serverTimestamp() // Opcional: data de criação
            });
            showMessage('Cadastro realizado com sucesso! Faça login.', 'success');
            // Opcional: Redirecionar para a tela de login após o cadastro
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
            loginEmailInput.value = email; // Preenche o email para o usuário
            loginPasswordInput.value = ''; // Limpa a senha
            registerPasswordInput.value = '';
            registerConfirmPasswordInput.value = '';
        } catch (error) {
            console.error('Erro ao cadastrar:', error.code, error.message);
            let errorMessage = 'Ocorreu um erro ao cadastrar.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está em uso.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'E-mail inválido.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'A senha é muito fraca.';
            }
            showMessage(errorMessage);
        } finally {
            registerBtn.disabled = false; // Reabilita o botão
        }
    });

    // Função de Login
    loginBtn.addEventListener('click', async () => {
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;

        if (!email || !password) {
            showMessage('Por favor, preencha todos os campos.');
            return;
        }

        try {
            loginBtn.disabled = true; // Desabilita o botão
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            showMessage('Login realizado com sucesso!', 'success');
            // Redirecionar para o index.html (página principal do app)
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erro ao fazer login:', error.code, error.message);
            let errorMessage = 'Ocorreu um erro ao fazer login.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'E-mail ou senha inválidos.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'E-mail inválido.';
            }
            showMessage(errorMessage);
        } finally {
            loginBtn.disabled = false; // Reabilita o botão
        }
    });

    // Função de Reset de Senha
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = prompt('Por favor, digite seu e-mail para resetar a senha:').trim();
        if (email) {
            try {
                await auth.sendPasswordResetEmail(email);
                showMessage('Link de redefinição de senha enviado para seu e-mail!', 'success');
            } catch (error) {
                console.error('Erro ao enviar e-mail de redefinição:', error.code, error.message);
                let errorMessage = 'Ocorreu um erro ao enviar o e-mail de redefinição.';
                if (error.code === 'auth/user-not-found') {
                    errorMessage = 'E-mail não encontrado.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'E-mail inválido.';
                }
                showMessage(errorMessage);
            }
        }
    });

    // Monitorar o estado de autenticação (para redirecionamento)
    auth.onAuthStateChanged(user => {
        // Se o usuário está logado E está na página de autenticação (auth.html), redireciona para index.html
        if (user && (window.location.pathname.endsWith('auth.html') || window.location.pathname.endsWith('/'))) {
            window.location.href = 'index.html';
        }
        // Se o usuário NÃO está logado E está na página principal (index.html), redireciona para auth.html
        // Essa parte é tratada no app.js para melhor controle.
    });
});