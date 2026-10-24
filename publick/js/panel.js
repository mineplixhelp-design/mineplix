<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Admin - Mineplix</title>
    <meta name="description" content="Panel Admin Manajemen Produk dan Pesanan Mineplix.">
    
    <link rel="icon" href="../publick/img/icon.png" type="image/png">
    <link rel="preload" href="https://op.al/fonts/DieGrotesk-C-Regular.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="https://op.al/fonts/DieGrotesk-C-Bold.woff2" as="font" type="font/woff2" crossorigin>

    <link rel="stylesheet" href="../publick/css/panel.css?v=7.0">
</head>
<body>

    <div class="panel-loader" id="panelLoader">
        <div class="loader-content">
            <div class="spinner-ring"></div>
            <img src="../publick/img/icon.png" alt="Mineplix Logo" class="loader-logo">
        </div>
    </div>

    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <header class="panel-header">
        <div class="header-left">
            <button class="burger-btn" id="burgerBtn" aria-label="Toggle Sidebar">
                <svg viewBox="0 0 24 24">
                    <path d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2z"/>
                </svg>
            </button>
            <div class="logo" onclick="window.location.href='/panel'">
                <img src="../publick/img/icon.png" alt="Mineplix Icon">
                <span>ineplix</span>
            </div>
        </div>

        <div class="header-right">
            <div class="header-action-item">
                <button class="icon-action-btn" id="settingBtn" aria-label="Pengaturan Profile">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                </button>

                <div class="dropdown-popover profile-popover" id="profilePopover">
                    <div class="user-info-header">
                        <div class="user-display-name" id="userName">Admin Mineplix</div>
                        <div class="user-email" id="userEmail">loading...</div>
                    </div>

                    <div class="popover-body-list">
                        <button class="dropdown-item logout-btn" id="logoutBtn">
                            <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <div class="panel-layout">
        <aside class="panel-sidebar" id="panelSidebar">
            <nav class="sidebar-nav">
                <div class="nav-item active" id="menuDashboard" onclick="switchTab('dashboard')">
                    <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                    <span>Katalog Produk</span>
                </div>
                <div class="nav-item" id="menuOrder" onclick="switchTab('order')">
                    <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    <span>Kelola Pesanan</span>
                </div>
            </nav>
            
            <div class="sidebar-footer">
                <div class="back-to-home" onclick="window.location.href='/'">
                    <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    <span>Kembali ke Website</span>
                </div>
            </div>
        </aside>

        <main class="panel-main">
            <div id="contentDashboard" class="tab-content active">
                <div class="page-header-title">
                    <h2>Manajemen Katalog Produk</h2>
                    <p>Kelola daftar layanan digital dan penambahan produk storefront.</p>
                </div>

                <div class="order-subtabs">
                    <div class="subtab-btn active" id="subtabAddProd" onclick="switchProdSubtab('add')">Tambah Produk</div>
                    <div class="subtab-btn" id="subtabListProd" onclick="switchProdSubtab('list')">Daftar Produk</div>
                </div>

                <div class="prod-subcontent-container">
                    <div id="prodContentAdd" class="prod-subcontent active">
                        <div class="admin-form-card fade-up visible">
                            <h3 id="formTitle">Tambah Produk Baru</h3>
                            <form id="productForm">
                                <input type="hidden" id="editCategory">
                                <input type="hidden" id="editProductId">

                                <div class="form-grid">
                                    <div class="form-group">
                                        <label>Kategori Produk</label>
                                        <div class="custom-dropdown form-cat-dropdown" id="formCatDropdown" data-value="frontend">
                                            <div class="custom-dropdown-toggle">
                                                <span id="formCatLabel">Frontend Web Design</span>
                                                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </div>
                                            <div class="custom-dropdown-menu">
                                                <div class="custom-dropdown-item" data-value="frontend" data-label="Frontend Web Design">Frontend Web Design</div>
                                                <div class="custom-dropdown-item" data-value="graphic" data-label="Graphic Design">Graphic Design</div>
                                                <div class="custom-dropdown-item" data-value="mapminecraft" data-label="Minecraft Maps Builder">Minecraft Maps Builder</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label for="prodTitle">Judul Produk</label>
                                        <input type="text" id="prodTitle" placeholder="Contoh: Modern Storefront UI" required>
                                    </div>

                                    <div class="form-group">
                                        <label for="prodPrice">Harga</label>
                                        <input type="text" id="prodPrice" placeholder="Contoh: 150000 / 150k" required>
                                    </div>

                                    <div class="form-group">
                                        <label for="prodLogo">URL Banner / Gambar</label>
                                        <input type="url" id="prodLogo" placeholder="https://domain.com/image.png" required>
                                    </div>

                                    <div class="form-group full-width">
                                        <label for="prodDesc">Deskripsi Ringkas</label>
                                        <textarea id="prodDesc" rows="3" placeholder="Deskripsikan fitur atau cakupan produk..." required></textarea>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button type="submit" class="btn-submit-prod" id="submitBtn">Simpan Produk</button>
                                    <button type="button" class="btn-cancel-prod" id="cancelEditBtn" style="display: none;">Batal Edit</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div id="prodContentList" class="prod-subcontent">
                        <div class="category-filter-tabs">
                            <button class="cat-tab-btn active" data-cat="frontend">Frontend Web Design</button>
                            <button class="cat-tab-btn" data-cat="graphic">Graphic Design</button>
                            <button class="cat-tab-btn" data-cat="mapminecraft">Minecraft Maps Builder</button>
                        </div>

                        <div id="adminProductGrid" class="admin-products-grid">
                            <div class="empty-state-card">Memuat katalog produk...</div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="contentOrder" class="tab-content">
                <div class="page-header-title">
                    <h2>Kelola Pesanan Masuk</h2>
                    <p>Atur alur pemrosesan pesanan pelanggan dari konfirmasi hingga selesai.</p>
                </div>

                <div class="order-subtabs">
                    <div class="subtab-btn active" id="subtabActive" onclick="switchOrderSubtab('active')">Pesanan Aktif</div>
                    <div class="subtab-btn" id="subtabHistory" onclick="switchOrderSubtab('history')">Pesanan Selesai</div>
                </div>

                <div class="order-subcontent-container">
                    <div id="orderContentActive" class="order-subcontent active">
                        <div class="empty-state-card">Memuat data pesanan...</div>
                    </div>

                    <div id="orderContentHistory" class="order-subcontent">
                        <div class="empty-state-card">Memuat data riwayat...</div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <div class="custom-modal-overlay" id="customModalOverlay">
        <div class="custom-modal-card" id="customModalCard">
            <h3 id="customModalTitle">Informasi</h3>
            <p id="customModalDesc">Pesan informasi sistem...</p>
            <div class="custom-modal-actions" id="customModalActions">
                <button class="custom-modal-btn cancel" id="customModalCancel">Batal</button>
                <button class="custom-modal-btn confirm" id="customModalConfirm">OK</button>
            </div>
        </div>
    </div>

    <script type="module" src="../publick/js/panel.js?v=7.0"></script>
</body>
</html>
