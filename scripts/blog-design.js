'use strict';
/* Site-owned Fluid views: upgrades never overwrite these files. */
const fs = require('fs');
const path = require('path');

hexo.extend.filter.register('theme_inject', function(injects) {
  injects.header.file('default', 'layout/blog-header.ejs');
});

hexo.on('generateBefore', function() {
  const layout = fs.readFileSync(path.join(hexo.theme_dir, 'layout/layout.ejs'), 'utf8');
  hexo.theme.setView('layout.ejs', layout.replace('<body>', '<body class="<%= is_home() ? \'page-home\' : is_post() ? \'page-post\' : \'page-list\' %>">'));
  hexo.theme.setView('index.ejs', fs.readFileSync(path.join(hexo.base_dir, 'layout/blog-index.ejs'), 'utf8'));
});
