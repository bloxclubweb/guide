function markdownToHTML(md) {
    let html = md
        .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
        .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/gim, '<em>$1</em>')
        .replace(/\!([^]+)([^)]+)/gim, (match, p1, p2) => {
            return `<div style="text-align: center;" class="content"><img src="${p2}" alt="${p1}"><span class="image-description">${p1}</span></div>`;
        })
        .replace(/([^]+)([^)]+)/gim, '<a href="$2">$1</a>')
        .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/(\n)/g, '<br>')
        .replace(/^> !IMPORTANT](.*$)/gim, '<div class="quote-card quote-important"><h3>IMPORTANT</h3><p>$1</p></div>')
        .replace(/^> !NOTE(.*$)/gim, '<div class="quote-card quote-note"><h3>NOTE</h3><p>$1</p></div>')
        .replace(/^> !TIP(.*$)/gim, '<div class="quote-card quote-tip"><h3>TIP</h3><p>$1</p></div>')
        .replace(/^> !WARNING(.*$)/gim, '<div class="quote-card quote-warning"><h3>WARNING</h3><p>$1</p></div>')
        .replace(/^> (.*$)/gim, '<div class="quote-card quote-default"><h3>Citação</h3><p>$1</p></div>')
        .replace(/```([^`]+)```/gim, '<div class="code-block"><button class="copy-button">Copiar</button><pre><code>$1</code></pre></div>');
    return html;
}

function loadPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileName = urlParams.get('file');
    
    if (fileName) {
        fetch(`./posts/${fileName}.md`)
            .then(response => {
                if (!response.ok) { 
                    window.location.href = "404.html";
                    throw new Error("Arquivo não encontrado.");
                }
                return response.text();
            })
            .then(md => {
                const authorInfo = extractAuthorInfo(md);
                const postHTML = markdownToHTML(md.replace(/Info {[^}]+}/, ''));
                const postContainer = document.getElementById('post-content');
                const postDate = getFileDate(`./posts/${fileName}.md`);
                
                postContainer.innerHTML = `
                    <article>
                        <h1>${fileName.replace(/-/g, ' ').replace(/\b\w/g, char => {
                        
                            return char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
                        })}</h1>
                        <div class="author-info">
                            <img src="${authorInfo.photo}" alt="${authorInfo.name}">
                            <span>Por <a href="${authorInfo.profileUrl}">${authorInfo.name}</a></span>
                        </div>
                        <p class="post-meta">Publicado em ${postDate}</p>
                        <div>${postHTML}</div>
                    </article>
                `;
                addCopyButtonEventListeners();
                document.querySelector('body').classList.add('loaded');
            })
            .catch(error => console.log('Erro ao carregar o post:', error));
    } else {
        window.location.href = "404.html";
    }
}

function addCopyButtonEventListeners() {
    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const code = button.nextElementSibling.innerText;
            navigator.clipboard.writeText(code)
                .then(() => {
                    button.innerText = 'Copied!';
                    setTimeout(() => {
                        button.innerText = 'Copiar';
                    }, 1500);
                })
                .catch(() => alert('Erro ao copiar'));
        });
    });
}

function summarizeText(content) {
    let sentences = content.split(". ");
    let summary = sentences.slice(0, 2).join(". ") + (sentences.length > 2 ? "." : "");
    return summary;
}

document.getElementById("summarizeButton").addEventListener("click", function() {
    const postContent = document.getElementById("post-content");

    const existingSummaryContainer = postContent.querySelector(".summary-container");

    if (existingSummaryContainer) {
        existingSummaryContainer.classList.remove('show');
    } else {
        const articleContent = postContent.querySelector("article").innerText;
        const summary = summarizeText(articleContent); 

        const summaryContainer = document.createElement("div");
        summaryContainer.classList.add("summary-container");
        summaryContainer.innerHTML = `
            <h4>
            <img src="./icon/ic_sum.svg" alt="Resumo">
                 Summer
            </h4>
            <h5>
            Resumo do texto
            </h5>
            <p>${summary}</p>
            <p class="auto-note">*Resumo gerado automaticamente.</p>
        `;
        
        postContent.prepend(summaryContainer);

        window.scrollTo({
            top: summaryContainer.offsetTop - 90,
            behavior: 'smooth'
        });

        setTimeout(() => summaryContainer.classList.add('show'), 100);
    }
});

function extractAuthorInfo(md) {
    const authorMatch = md.match(/Info {\s*AuthorName: ([^\n]+)\s*AuthorUrlProfile: ([^\n]+)\s*AuthorPhoto: ([^\n]+)\s*}/);
    if (authorMatch) {
        return {
            name: authorMatch[1].trim(),
            profileUrl: authorMatch[2].trim(),
            photo: authorMatch[3].trim()
        };
    }
    return {
        name: 'Desconhecido',
        profileUrl: '#',
        photo: './default-avatar.png'
    };
}

function getFileDate(filePath) {
    // Example function to extract the date from the file's path or metadata
    // This can be customized based on your server setup or file structure
    const date = new Date();
    return date.toLocaleDateString('pt-BR');
}

window.onload = loadPost;
