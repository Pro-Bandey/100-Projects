
const themeBtn = document.querySelector('.theme-btn');
const body = document.body;

if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark');
}

themeBtn.addEventListener('click', () => {
    body.classList.toggle('dark');
    localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
});

const menuToggle = document.getElementById('menu-toggle');
const menuContainer = document.querySelector('.menu-container');
const navpad = document.querySelector('.navbar');

menuToggle.addEventListener('click', () => {
    menuContainer.classList.toggle('active');
    navpad.classList.toggle('navpadd');
});

fetch('./js/projects.json')
    .then(res => res.json())
    .then(projects => {
        const container = document.getElementById('project-container');
        container.innerHTML = '';

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';

            let innerHTML = `<h3>${project.name}</h3>
                           <p>${project.description || ''}</p>`;


            if (project.demos && project.demos.length > 0) {
                innerHTML += `<ht><button class="preview-btn">Preview</button>`;
            } else if (project.path) {
                innerHTML += `<hr><a class="preview-link" href="${project.path}" target="_blank">Preview⇗</a>`;
            }

            innerHTML += `<a class="github-link" href="https://github.com/pro-bandey/100-Projects/blob/main/${project.path || ''}" target="_blank">Source Code⇗</a>`;

            card.innerHTML = innerHTML;
            container.appendChild(card);
            observer.observe(card);

            const previewBtn = card.querySelector('.preview-btn');
            if (previewBtn) {
                previewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openPopup(project);
                });
            }
        });
    })
    .catch(err => {
        console.error('Failed to load projects:', err);
        document.getElementById('project-container').innerHTML = '<p style="color:red;text-align:center;">Failed to load projects. Check JSON & paths.</p>';
    });

function openPopup(project) {
    const popup = document.getElementById('sub-popup');
    const title = document.getElementById('popup-title');
    const links = document.getElementById('popup-links');
    title.textContent = project.name;
    links.innerHTML = '';
    project.demos.forEach(demo => {
        const a = document.createElement('a');
        a.href = demo.path;
        a.textContent = demo.title;
        a.target = '_blank';
        links.appendChild(a);
    });
    popup.classList.add('show');
}

function closePopup() {
    document.getElementById('sub-popup').classList.remove('show');
}

function searchProjects() {
    const q = document.getElementById('search-input').value.toLowerCase();
    document.querySelectorAll('.project-card').forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = title.includes(q) ? 'block' : 'none';
    });
}

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('show');
    });
});