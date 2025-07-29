// Apply theme immediately to prevent flash of wrong theme
(function() {
    const theme = localStorage.getItem('theme') || 'light'; 
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    /*=============== THEME & UI SYNCHRONIZATION ===============*/
    const themeSwitch = document.getElementById('theme-switch-toggle');
    const htmlEl = document.documentElement;

    // Function to set the theme and update all UI elements
    function applyTheme(theme) {
        if (theme === 'dark') {
            htmlEl.classList.add('dark-mode');
            themeSwitch.checked = true;
        } else {
            htmlEl.classList.remove('dark-mode');
            themeSwitch.checked = false;
        }
        localStorage.setItem('theme', theme);
    }

    // Listener for the main toggle on the Settings page
    themeSwitch.addEventListener('change', () => {
        const newTheme = themeSwitch.checked ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    // Initialize theme on page load
    const initialTheme = localStorage.getItem('theme') || 'light';
    applyTheme(initialTheme);
    
    /*=============== EXPANDABLE MENU LOGIC ===============*/
    const navExpandBtn = document.getElementById('nav-expand');
    const navExpandList = document.getElementById('nav-expand-list');
    const navExpandIcon = document.getElementById('nav-expand-icon');

    navExpandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navExpandList.classList.toggle('show-list');
        navExpandIcon.classList.toggle('rotate-icon');
    });

    document.addEventListener('click', () => {
        if (navExpandList.classList.contains('show-list')) {
            navExpandList.classList.remove('show-list');
            navExpandIcon.classList.remove('rotate-icon');
        }
    });
    
    /*=============== PAGE NAVIGATION LOGIC ===============*/
    const navLinks = document.querySelectorAll('.nav__link');
    const sections = document.querySelectorAll('.section');

    function showSection(targetId) {
        sections.forEach(section => {
            section.classList.toggle('active', section.id === targetId);
        });
        window.scrollTo(0, 0); // Scroll to top of page on navigation
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
            navLinks.forEach(l => l.classList.remove('active-link'));
            link.classList.add('active-link');
        });
    });

    /*=============== IFRAME NAVIGATION ===============*/
    const iframeContainer = document.getElementById('iframe-container');
    const iframeContent = document.getElementById('iframe-content');
    const iframeTitle = document.getElementById('iframe-title');
    const iframeClose = document.getElementById('iframe-close');

    function openInIframe(url, title) {
        iframeTitle.textContent = title || 'Content';
        iframeContent.src = url;
        iframeContainer.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    iframeClose.addEventListener('click', () => {
        iframeContainer.style.display = 'none';
        iframeContent.src = '';
        document.body.style.overflow = '';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && iframeContainer.style.display === 'flex') {
            iframeClose.click();
        }
    });
    
    document.querySelectorAll('.nav__expand-link[data-url]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            openInIframe(link.dataset.url, link.querySelector('span').textContent);
        });
    });

    /*=============== DYNAMIC CONTENT (STORIES, POSTS, PROJECTS) ===============*/
    function setupDynamicContent() {
        // --- STORIES LOGIC ---
        const storiesContainer = document.querySelector(".stories-container");
        if(storiesContainer) {
            const SHEET_URL = "https://docs.google.com/spreadsheets/d/1p63AK6_2JPI1prbQpglHi5spB2f1y2PbcdnsvtS74g8/export?format=csv";
            const storyFull = document.querySelector(".story-full"), 
                  storyFullImage = storyFull.querySelector("img"), 
                  storyFullTitle = storyFull.querySelector(".title"), 
                  learnMoreBtn = storyFull.querySelector(".learn-more-btn"), 
                  closeBtn = storyFull.querySelector(".close-btn"), 
                  leftArrow = storyFull.querySelector(".left-arrow"), 
                  rightArrow = storyFull.querySelector(".right-arrow");

            let storiesData = [], currentIndex = 0, timer, viewedStories = JSON.parse(localStorage.getItem('viewedStories')) || [];

            const loadStories = async () => { 
                try { 
                    const r = await fetch(SHEET_URL); 
                    if(!r.ok) throw new Error("Network error"); 
                    const d = await r.text(); 
                    storiesData = d.split('\n').slice(1).map((l,i)=>{
                        const c=l.split(',');return{
                            thumbUrl:c[0]?.trim(),
                            imageUrl:c[1]?.trim(),
                            link:c[2]?.trim(),
                            title:c[3]?.trim()||"Untitled",
                            id:`story-${i}`
                        }
                    }).filter(s=>s.thumbUrl&&s.imageUrl); 
                    renderStories(); 
                } catch(e){ 
                    console.error("Error loading stories:",e); 
                    storiesContainer.innerHTML=`<p style="color:var(--text-secondary);margin:auto;">Could not load stories.</p>`; 
                } 
            };

            const renderStories = () => { 
                storiesContainer.innerHTML=''; 
                storiesData.sort((a,b)=>(viewedStories.includes(a.id)?1:-1)-(viewedStories.includes(b.id)?1:-1)); 
                storiesData.forEach((s,i)=>{
                    const item=document.createElement("div");
                    item.className=`story-item ${viewedStories.includes(s.id)?"viewed":""}`;
                    item.dataset.id=s.id;
                    item.innerHTML=`<div class="content"><img src="${s.thumbUrl}" alt="${s.title}" loading="lazy"></div><div class="story-title">${s.title}</div>`;
                    item.querySelector('.content').addEventListener("click",()=>openStory(i));
                    storiesContainer.appendChild(item);
                }); 
            };

            const markViewed = id => { 
                if(!viewedStories.includes(id)){ 
                    viewedStories.push(id); 
                    localStorage.setItem('viewedStories',JSON.stringify(viewedStories)); 
                    document.querySelector(`.story-item[data-id="${id}"]`)?.classList.add('viewed'); 
                } 
            };

            const openStory = i => { 
                currentIndex=i; 
                const s=storiesData[i]; 
                storyFull.classList.add("active"); 
                storyFullImage.src=s.imageUrl; 
                storyFullTitle.textContent=s.title; 
                learnMoreBtn.href=s.link||'#'; 
                learnMoreBtn.style.display=s.link?'block':'none'; 
                if(s.link)learnMoreBtn.onclick=e=>{e.preventDefault();openInIframe(s.link,s.title);}; 
                markViewed(s.id); 
                clearInterval(timer); 
                timer=setInterval(nextStory,5000); 
            };

            const closeStory = () => { 
                storyFull.classList.remove("active"); 
                clearInterval(timer); 
            };

            const nextStory = () => currentIndex<storiesData.length-1?openStory(currentIndex+1):closeStory();

            const prevStory = () => currentIndex>0?openStory(currentIndex-1):null;

            closeBtn.addEventListener("click",closeStory); 
            leftArrow.addEventListener("click",prevStory); 
            rightArrow.addEventListener("click",nextStory); 
            document.addEventListener("keydown",e=>{
                if(!storyFull.classList.contains("active"))return;
                if(e.key==="ArrowRight")nextStory();
                if(e.key==="ArrowLeft")prevStory();
                if(e.key==="Escape")closeStory();
            });

            loadStories();
        }

        // --- INSTAGRAM POSTS LOGIC ---
        const postsContainer = document.getElementById("instagram-posts");
        if(postsContainer) {
            const SHEET_URL = "https://docs.google.com/spreadsheets/d/1aDM5fGKjmLmYNkkQCW4NuSZsVorj_5ETk9KygVsD0OA/export?format=csv";

            const loadPosts = async () => { 
                try { 
                    const r = await fetch(SHEET_URL); 
                    if(!r.ok) throw new Error("Network error"); 
                    const d = await r.text(); 
                    const p = d.split('\n').slice(1).map(l=>{
                        const c=l.split(',');
                        return{
                            imageUrl:c[0]?.trim(),
                            title:c[1]?.trim()||"Untitled",
                            link:c[2]?.trim()||"#" 
                        }
                    }).filter(p=>p.imageUrl); 
                    renderPosts(p); 
                } catch (e) { 
                    console.error("Error loading posts:",e); 
                    postsContainer.innerHTML=`<div class="post-error">Failed to load posts.</div>`; 
                }
            };

            const renderPosts = p => { 
                postsContainer.innerHTML=p.length?'':`<div class="loading-posts">No posts yet.</div>`; 
                p.forEach(post=>{
                    const el=document.createElement("div");
                    el.className="instagram-post";
                    el.innerHTML=`<img src="${post.imageUrl}" class="post-image" alt="${post.title}" loading="lazy"><div class="post-title">${post.title}</div>`;
                    el.querySelector('.post-image').addEventListener('click',()=>{
                        if(post.link&&post.link!=='#')openInIframe(post.link,post.title);
                    });
                    postsContainer.appendChild(el);
                }); 
            };

            loadPosts();
        }
        
        // --- PROJECTS GRID LOGIC ---
        const projectGrid = document.getElementById('projectGrid');
        if(projectGrid) {
            const CFG = {csvUrl:'https://docs.google.com/spreadsheets/d/13ZV6BXtXKp9aQCKc0OHQoLFCRrif32zvx4khFc4bR9w/export?format=csv',icon:'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4bb.svg'};
            const searchBar=document.getElementById('projectSearchBar'), 
                  msgEl=document.getElementById('projectMessage'); 
            let allProjects=[];

            const debounce=(fn,d)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),d);};};

            const fetchProjects=async()=>{
                showMsg(true);
                try{
                    const r=await fetch(CFG.csvUrl);
                    if(!r.ok)throw new Error('Network error');
                    const d=await r.text();
                    allProjects=d.trim().split('\n').map(l=>{
                        const[n,i,k]=l.split(',').map(p=>p.trim());
                        return{
                            name:n,
                            icon:i||CFG.icon,
                            link:k,
                            search:(n||'').toLowerCase()
                        };
                    }).filter(p=>p.name&&p.link);
                    displayProjects(allProjects);
                }catch(e){
                    console.error('Error fetching projects:',e);
                    showMsg(false,'Failed to load projects.','error');
                }finally{
                    if(allProjects.length>0)showMsg(false);
                }
            };

            const displayProjects=p=>{
                projectGrid.innerHTML='';
                showMsg(false);
                if(p.length===0){
                    showMsg(true,'No projects match search.','info');
                    return;
                }
                p.forEach(proj=>{
                    const card=document.createElement('article');
                    card.className='project-card';
                    card.innerHTML=`<div class="project-icon-container"><img src="${proj.icon}" class="project-icon" alt="" loading="lazy" onerror="this.src='${CFG.icon}'"></div><h3 class="project-name">${proj.name}</h3>`;
                    card.addEventListener('click',()=>openInIframe(proj.link,proj.name));
                    projectGrid.appendChild(card);
                });
            };

            const showMsg=(show,text,type='info')=>{
                msgEl.style.display=show?'flex':'none';
                if(text){
                    const icons={info:'fas fa-info-circle',error:'fas fa-exclamation-circle'};
                    msgEl.innerHTML=`<i class="${icons[type]} message-icon"></i><p>${text}</p>`;
                }else{
                    msgEl.innerHTML=`<div class="loading-spinner"></div><p>Loading projects...</p>`;
                }
            };

            searchBar.addEventListener('input',debounce(()=>displayProjects(allProjects.filter(p=>p.search.includes(searchBar.value.toLowerCase()))),300);

            fetchProjects();
        }
    }
    
    // --- CONTACT FORM LOGIC ---
    const contactForm = document.getElementById('contact-form');
    if(contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const data=new FormData(contactForm), statusEl=document.getElementById('form-status');
            const mailto = `mailto:mpcrack65@gmail.com?subject=${encodeURIComponent(data.get('subject'))}&body=${encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\nMessage:\n${data.get('message')}`)}`;
            try{
                window.location.href=mailto;
                statusEl.textContent='Opening your email client...';
                statusEl.className='success';
                statusEl.style.display='block';
                setTimeout(()=>{
                    contactForm.reset();
                    statusEl.style.display='none';
                },4000);
            }catch(err){
                statusEl.textContent='Could not open email client.';
                statusEl.className='error';
                statusEl.style.display='block';
            }
        });
    }
    
    // Initialize all dynamic functionality
    setupDynamicContent();
});
