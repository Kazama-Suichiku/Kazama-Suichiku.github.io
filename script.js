// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyAU2iWEKT1qi8B3Fg1JHTfhFC_SQmyOF2k",
    authDomain: "my-blog-fa883.firebaseapp.com",
    databaseURL: "https://my-blog-fa883-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "my-blog-fa883",
    storageBucket: "my-blog-fa883.firebasestorage.app",
    messagingSenderId: "142782336652",
    appId: "1:142782336652:web:18e907b3e4510bfb2eb5a9",
    measurementId: "G-TZ7XSZTECY"
  };
  
  // 初始化 Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  // 数据存储
  let articles = [];
  let comments = [];
  const categories = ['技术', '生活', '其他'];
  
  // 显示通知
  function showNotification(message, type = 'error') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
  }
  
  // 获取并监听数据
  function listenData() {
      db.ref('blog').on('value', (snapshot) => {
          const data = snapshot.val() || { articles: [], comments: [] };
          articles = data.articles ? data.articles.map(a => ({
              ...a,
              id: a.id.toString()
          })) : [];
          comments = data.comments ? data.comments.map(c => ({
              ...c,
              id: c.id.toString(),
              articleId: c.articleId.toString()
          })) : [];
          console.log('数据加载成功:', { articles, comments }); // 调试日志
          showHome();
          updateSyncStatus();
          showNotification('数据已同步！', 'success');
      }, (error) => {
          console.error('Firebase 错误:', error);
          showNotification(`同步失败: ${error.message}`, 'error');
          showHome(); // 即使出错也渲染 UI
      });
  }
  
  // 保存数据
  async function saveData() {
      try {
          await db.ref('blog').set({ articles, comments });
          showNotification('数据保存成功！', 'success');
      } catch (e) {
          console.error('保存错误:', e);
          showNotification(`保存失败: ${e.message}`, 'error');
      }
  }
  
  // 显示同步状态
  function updateSyncStatus() {
      let status = document.querySelector('.sync-status');
      if (!status) {
          status = document.createElement('div');
          status.className = 'sync-status';
          document.body.appendChild(status);
      }
      status.textContent = `实时同步中`;
  }
  
  // 压缩图片
  function compressImage(file, maxSize = 800, quality = 0.7) {
      return new Promise((resolve) => {
          const img = new Image();
          const reader = new FileReader();
          reader.onload = (e) => {
              img.src = e.target.result;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  let width = img.width;
                  let height = img.height;
                  if (width > height && width > maxSize) {
                      height = Math.round((height * maxSize) / width);
                      width = maxSize;
                  } else if (height > maxSize) {
                      width = Math.round((width * maxSize) / height);
                      height = maxSize;
                  }
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL('image/jpeg', quality));
              };
          };
          reader.readAsDataURL(file);
      });
  }
  
  // 高亮关键词
  function highlightText(text, query) {
      if (!query) return text;
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
  }
  
  // 显示图片弹窗
  function showImageModal(src) {
      const modal = document.createElement('div');
      modal.className = 'image-modal';
      modal.innerHTML = `
          <span class="close">×</span>
          <img src="${src}">
      `;
      document.body.appendChild(modal);
      modal.style.display = 'flex';
      modal.querySelector('.close').addEventListener('click', () => {
          modal.remove();
      });
  }
  
  // 渲染文章列表
  function renderArticles(filteredArticles, query = '', page = 1, perPage = 10) {
      const articleList = document.querySelector('.article-list');
      articleList.innerHTML = '';
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const paginatedArticles = filteredArticles.slice(start, end);
      if (paginatedArticles.length === 0 && page === 1) {
          articleList.innerHTML = '<div class="empty">暂无文章，请发布新文章！</div>';
          return;
      }
      paginatedArticles.forEach(article => {
          const articleDiv = document.createElement('div');
          articleDiv.className = 'article';
          const summary = article.content.substring(0, 100) + (article.content.length > 100 ? '...' : '');
          articleDiv.innerHTML = `
              ${article.images && article.images[0] ? `<img src="${article.images[0]}" alt="文章图片">` : ''}
              <div class="content">
                  <h2><a href="#article/${article.id}">${highlightText(article.title, query)}</a></h2>
                  <p>${highlightText(summary, query)}</p>
                  <p>分类: ${article.category || '其他'} | ${article.date}</p>
                  <div class="article-actions">
                      <button class="edit-button" data-id="${article.id}">编辑</button>
                      <button class="delete-button" data-id="${article.id}">删除</button>
                  </div>
              </div>
          `;
          articleList.appendChild(articleDiv);
      });
      const totalPages = Math.ceil(filteredArticles.length / perPage);
      if (totalPages > 1) {
          const pagination = document.createElement('div');
          pagination.className = 'pagination';
          for (let i = 1; i <= totalPages; i++) {
              pagination.innerHTML += `<button ${i === page ? 'class="active"' : ''} data-page="${i}">${i}</button>`;
          }
          articleList.insertAdjacentElement('afterend', pagination);
      }
  }
  
  // 编辑文章表单
  async function showEditForm(articleId) {
      const article = articles.find(a => a.id == articleId);
      if (!article) {
          showHome();
          return;
      }
      const content = document.getElementById('content');
      content.innerHTML = `
          <h1>编辑文章</h1>
          <form id="editArticleForm" class="edit-article-form">
              <input type="text" id="articleTitle" value="${article.title}" required>
              <select id="articleCategory" required>
                  ${categories.map(cat => `<option value="${cat}" ${cat === article.category ? 'selected' : ''}>${cat}</option>`).join('')}
              </select>
              <textarea id="articleContent" required>${article.content}</textarea>
              <input type="file" id="articleImage" accept="image/*" multiple>
              <div class="image-preview" id="imagePreview"></div>
              <button type="submit">保存</button>
          </form>
      `;
      updateSyncStatus();
      const preview = content.querySelector('#imagePreview');
      (article.images || []).forEach((img, index) => {
          const container = document.createElement('div');
          container.className = 'image-container';
          container.innerHTML = `
              <img src="${img}" alt="预览">
              <button class="delete-image" data-index="${index}">×</button>
          `;
          preview.appendChild(container);
          container.querySelector('img').addEventListener('click', () => showImageModal(img));
      });
      const imageInput = content.querySelector('#imagePreview');
      imageInput.addEventListener('change', async function() {
          const files = Array.from(this.files);
          if (files.length + (article.images || []).length > 5) {
              showNotification('最多上传5张图片！', 'error');
              this.value = '';
              return;
          }
          for (let file of files) {
              if (file.size > 2 * 1024 * 1024) {
                  showNotification('每张图片需小于2MB！', 'error');
                  continue;
              }
              const compressed = await compressImage(file);
              const container = document.createElement('div');
              container.className = 'image-container';
              container.innerHTML = `<img src="${compressed}" alt="预览">`;
              preview.appendChild(container);
              container.querySelector('img').addEventListener('click', () => showImageModal(compressed));
          }
      });
      preview.addEventListener('click', function(e) {
          if (e.target.classList.contains('delete-image')) {
              const index = e.target.getAttribute('data-index');
              article.images.splice(index, 1);
              showEditForm(articleId);
          }
      });
      const form = content.querySelector('#editArticleForm');
      form.addEventListener('submit', async function(e) {
          e.preventDefault();
          const title = document.getElementById('articleTitle').value;
          const category = document.getElementById('articleCategory').value;
          const content = document.getElementById('articleContent').value;
          const newImages = Array.from(imageInput.files);
          const date = new Date().toISOString().split('T')[0];
          if (newImages.length + (article.images || []).length > 5) {
              showNotification('最多上传5张图片！', 'error');
              return;
          }
          let updatedImages = [...(article.images || [])];
          if (newImages.length) {
              const imagePromises = newImages.map(async file => {
                  if (file.size > 2 * 1024 * 1024) {
                      showNotification('每张图片需小于2MB！', 'error');
                      return null;
                  }
                  return await compressImage(file);
              });
              const results = await Promise.all(imagePromises);
              updatedImages = updatedImages.concat(results.filter(r => r));
          }
          articles = articles.map(a =>
              a.id == articleId ? { id: a.id, title, content, date, images: updatedImages, category } : a
          );
          await saveData();
          showHome();
      });
  }
  
  // 首页
  function showHome() {
      const content = document.getElementById('content');
      content.innerHTML = `
          <h1>文章列表</h1>
          <div class="filters">
              <select id="categoryFilter">
                  <option value="">所有分类</option>
                  ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
              </select>
              <input type="text" id="searchInput" placeholder="搜索文章...">
          </div>
          <form id="newArticleForm" class="new-article-form">
              <input type="text" id="articleTitle" placeholder="文章标题" required>
              <select id="articleCategory" required>
                  ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
              </select>
              <textarea id="articleContent" placeholder="文章内容" required></textarea>
              <input type="file" id="articleImage" accept="image/*" multiple>
              <div class="image-preview" id="imagePreview"></div>
              <button type="submit">发布文章</button>
          </form>
          <div class="article-list"></div>
      `;
      updateSyncStatus();
      const categoryFilter = content.querySelector('#categoryFilter');
      const searchInput = content.querySelector('#searchInput');
      let currentPage = 1;
      function updateArticles(page = 1) {
          currentPage = page;
          const category = categoryFilter.value;
          const query = searchInput.value.toLowerCase();
          let filteredArticles = articles;
          if (category) {
              filteredArticles = filteredArticles.filter(article => article.category === category);
          }
          if (query) {
              filteredArticles = filteredArticles.filter(article =>
                  article.title.toLowerCase().includes(query) ||
                  article.content.toLowerCase().includes(query)
              );
          }
          renderArticles(filteredArticles, query, page);
      }
      categoryFilter.addEventListener('change', () => updateArticles(1));
      searchInput.addEventListener('input', function() {
          updateArticles(1);
          const query = this.value.toLowerCase();
          const existingSuggestions = content.querySelector('.search-suggestions');
          if (existingSuggestions) existingSuggestions.remove();
          if (!query) return;
          const suggestions = document.createElement('div');
          suggestions.className = 'search-suggestions';
          const matches = articles.filter(a => a.title.toLowerCase().includes(query)).slice(0, 5);
          suggestions.innerHTML = matches.map(a => `<div class="suggestion">${a.title}</div>`).join('');
          if (matches.length) {
              this.parentNode.appendChild(suggestions);
              suggestions.querySelectorAll('.suggestion').forEach(s => {
                  s.addEventListener('click', () => {
                      searchInput.value = s.textContent;
                      suggestions.remove();
                      updateArticles(1);
                  });
              });
          }
      });
      document.addEventListener('click', async (e) => {
          if (!e.target.closest('.filters')) {
              const suggestions = content.querySelector('.search-suggestions');
              if (suggestions) suggestions.remove();
          }
          if (e.target.matches('.pagination button')) {
              const page = parseInt(e.target.dataset.page);
              updateArticles(page);
          }
          const target = e.target;
          const articleId = target.getAttribute('data-id');
          if (target.classList.contains('edit-button') && articleId) {
              showEditForm(articleId);
          } else if (target.classList.contains('delete-button') && articleId) {
              if (confirm('确定要删除这篇文章吗？')) {
                  articles = articles.filter(a => a.id != articleId);
                  comments = comments.filter(c => c.articleId != articleId);
                  await saveData();
                  showHome();
              }
          }
      });
      const imageInput = content.querySelector('#articleImage');
      const preview = content.querySelector('#imagePreview');
      imageInput.addEventListener('change', async function() {
          preview.innerHTML = '';
          const files = Array.from(this.files);
          if (files.length > 5) {
              showNotification('最多上传5张图片！', 'error');
              this.value = '';
              return;
          }
          for (let file of files) {
              if (file.size > 2 * 1024 * 1024) {
                  showNotification('每张图片需小于2MB！', 'error');
                  continue;
              }
              const compressed = await compressImage(file);
              const container = document.createElement('div');
              container.className = 'image-container';
              container.innerHTML = `<img src="${compressed}" alt="预览">`;
              preview.appendChild(container);
              container.querySelector('img').addEventListener('click', () => showImageModal(compressed));
          }
      });
      const form = content.querySelector('#newArticleForm');
      form.addEventListener('submit', async function(e) {
          e.preventDefault();
          const title = document.getElementById('articleTitle').value;
          const category = document.getElementById('articleCategory').value;
          const content = document.getElementById('articleContent').value;
          const files = Array.from(document.getElementById('articleImage').files);
          const date = new Date().toISOString().split('T')[0];
          const id = articles.length ? Math.max(...articles.map(a => parseInt(a.id))) + 1 : 1;
          if (files.length > 5) {
              showNotification('最多上传5张图片！', 'error');
              return;
          }
          if (files.length) {
              const imagePromises = files.map(async file => {
                  if (file.size > 2 * 1024 * 1024) {
                      showNotification('每张图片需小于2MB！', 'error');
                      return null;
                  }
                  return await compressImage(file);
              });
              const images = (await Promise.all(imagePromises)).filter(i => i);
              articles.push({ id, title, content, date, images, category });
              await saveData();
              form.reset();
              preview.innerHTML = '';
              showHome();
          } else {
              articles.push({ id, title, content, date, images: [], category });
              await saveData();
              form.reset();
              preview.innerHTML = '';
              showHome();
          }
      });
      updateArticles();
  }
  
  // 文章页
  function showArticle(articleId) {
      const article = articles.find(a => a.id == articleId);
      if (!article) {
          showHome();
          return;
      }
      const content = document.getElementById('content');
      content.innerHTML = `
          <div class="article-page">
              <h1>${article.title}</h1>
              <p>分类: ${article.category}</p>
              ${article.images && article.images.length ? `
                  <div class="gallery">
                      <button class="prev">◄</button>
                      <img src="${article.images[0]}" alt="文章图片">
                      <button class="next">►</button>
                      <div class="counter">1/${article.images.length}</div>
                  </div>
              ` : ''}
              <p>${article.content}</p>
              <p>${article.date}</p>
              <div class="comments"></div>
              <form id="commentForm">
                  <input type="text" id="name" placeholder="姓名" required>
                  <textarea id="comment" placeholder="评论" required></textarea>
                  <button type="submit">提交评论</button>
              </form>
          </div>
      `;
      updateSyncStatus();
      if (article.images && article.images.length) {
          let current = 0;
          const img = content.querySelector('.gallery img');
          const counter = content.querySelector('.counter');
          content.querySelector('.prev').addEventListener('click', () => {
              current = (current - 1 + article.images.length) % article.images.length;
              img.src = article.images[current];
              counter.textContent = `${current + 1}/${article.images.length}`;
          });
          content.querySelector('.next').addEventListener('click', () => {
              current = (current + 1) % article.images.length;
              img.src = article.images[current];
              counter.textContent = `${current + 1}/${article.images.length}`;
          });
          content.querySelectorAll('.gallery img').forEach(img => {
              img.addEventListener('click', () => showImageModal(img.src));
          });
      }
      const commentsDiv = content.querySelector('.comments');
      const articleComments = comments.filter(c => c.articleId == articleId);
      function renderComments(parentId = null, container, level = 0) {
          const commentsToShow = articleComments.filter(c => c.parentId == parentId);
          commentsToShow.forEach(comment => {
              const commentDiv = document.createElement('div');
              commentDiv.className = `comment ${comment.parentId ? 'reply' : ''}`;
              commentDiv.innerHTML = `
                  <p><strong>${comment.name}</strong>: ${comment.comment} <small>(${comment.date})</small></p>
                  <button class="reply-button" data-comment-id="${comment.id}">回复</button>
              `;
              container.appendChild(commentDiv);
              const repliesContainer = document.createElement('div');
              commentDiv.appendChild(repliesContainer);
              renderComments(comment.id, repliesContainer, level + 1);
          });
      }
      renderComments(null, commentsDiv);
      commentsDiv.addEventListener('click', (e) => {
          if (e.target.classList.contains('reply-button')) {
              const commentId = e.target.dataset.commentId;
              const form = content.querySelector('#commentForm');
              form.dataset.replyTo = commentId;
              form.querySelector('#comment').placeholder = '回复评论...';
              form.scrollIntoView({ behavior: 'smooth' });
          }
      });
      const form = content.querySelector('#commentForm');
      form.addEventListener('submit', async function(e) {
          e.preventDefault();
          const name = document.getElementById('name').value;
          const commentText = document.getElementById('comment').value;
          const date = new Date().toISOString().split('T')[0];
          const parentId = form.dataset.replyTo || null;
          const commentId = comments.length ? Math.max(...comments.map(c => parseInt(c.id))) + 1 : 1;
          comments.push({ id: commentId, articleId: articleId, name, comment: commentText, date, parentId });
          await saveData();
          delete form.dataset.replyTo;
          form.querySelector('#comment').placeholder = '评论';
          form.reset();
          showArticle(articleId);
      });
  }
  
  // 关于页
  function showAbout() {
      const content = document.getElementById('content');
      content.innerHTML = `
          <div class="about-page">
              <h1>关于我</h1>
              <p>欢迎访问我的博客！这是一个我的记录技术美术学习记录的博客平台，专注于分享有趣的内容和知识。</p>
              <p>在这里，你可以阅读文章、发表评论，并与社区互动。我会致力于提供一个干净、简洁的用户体验。</p>
              <p>联系我：fengzhongcuizhu@gmail.com</p>
          </div>
      `;
  }
  
  // 返回顶部
  function initBackToTop() {
      const backToTop = document.querySelector('.back-to-top');
      window.addEventListener('scroll', () => {
          backToTop.classList.toggle('visible', window.scrollY > 300);
      });
      backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
  
  // 导航高亮
  function updateNav() {
      document.querySelectorAll('nav a').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === window.location.hash || (a.getAttribute('href') === '#home' && !window.location.hash));
      });
  }
  
  // 路由
  function router() {
      const hash = window.location.hash;
      if (hash.startsWith('#article/')) {
          const articleId = hash.split('/')[1];
          showArticle(articleId);
      } else if (hash === '#about') {
          showAbout();
      } else {
          showHome();
      }
      updateNav();
  }
  
  // 初始化
  window.addEventListener('hashchange', router);
  window.addEventListener('load', () => {
      console.log('页面加载，初始化 Firebase...');
      listenData();
      router();
      initBackToTop();
  });
