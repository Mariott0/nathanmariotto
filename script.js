document.addEventListener("DOMContentLoaded", function () {
    emailjs.init("lrgpAJHTzMskRbUu3"); 
    
    document.getElementById("meuFormulario").addEventListener("submit", function (event) {
        event.preventDefault(); 

        const statusMensagem = document.getElementById("statusMensagem");

        const templateParams = {
            nome: document.getElementById("nome").value,
            email: document.getElementById("email").value,
            mensagem: document.getElementById("mensagem").value
        };

    
        emailjs.send("service_wi9ax7q", "template_c4d492n", templateParams)
            .then(function (response) {
                console.log("E-mail enviado com sucesso!", response);
                statusMensagem.innerHTML = "Mensagem enviada com sucesso!";
                statusMensagem.style.color = "green";
                document.getElementById("meuFormulario").reset(); 
            }, function (error) {
                console.error("Erro ao enviar o e-mail:", error);
                statusMensagem.innerHTML = "Erro ao enviar mensagem. Tente novamente.";
                statusMensagem.style.color = "red";
            });
    });
});





/*
EmailJS --->
key public: lrgpAJHTzMskRbUu3
Service ID: service_wi9ax7q
Template ID: template_c4d492n*/

