/* ==========================================================================
   KASIRPRO - CORE APPLICATION LOGIC & STATE MANAGEMENT
   ========================================================================== */

(function () {
    'use strict';

    // --- DATA MASTER PRODUK TOKO (stok awal) ---
    const INITIAL_PRODUCTS = [
        {
            id: 'PROD-001',
            name: 'Kopi Susu Gula Aren',
            category: 'Minuman',
            buyPrice: 8000,
            sellPrice: 18000,
            stock: 24,
            image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80'
        },
        {
            id: 'PROD-002',
            name: 'Ayam Geprek Sambal Matah',
            category: 'Makanan',
            buyPrice: 12000,
            sellPrice: 24000,
            stock: 18,
            image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80'
        },
        {
            id: 'PROD-003',
            name: 'Es Teh Manis Jumbo',
            category: 'Minuman',
            buyPrice: 2000,
            sellPrice: 6000,
            stock: 45,
            image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80'
        },
        {
            id: 'PROD-004',
            name: 'Beef Cheese Burger',
            category: 'Makanan',
            buyPrice: 16000,
            sellPrice: 32000,
            stock: 12,
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80'
        },
        {
            id: 'PROD-005',
            name: 'French Fries Crispy',
            category: 'Snack',
            buyPrice: 6000,
            sellPrice: 15000,
            stock: 4,
            image: 'assets/images/french-fries.jpg'
        },
        {
            id: 'PROD-006',
            name: 'Nasi Goreng Spesial',
            category: 'Makanan',
            buyPrice: 14000,
            sellPrice: 28000,
            stock: 3,
            image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=300&q=80'
        },
        {
            id: 'PROD-007',
            name: 'Matcha Latte Ice',
            category: 'Minuman',
            buyPrice: 10000,
            sellPrice: 22000,
            stock: 15,
            image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=300&q=80'
        },
        {
            id: 'PROD-008',
            name: 'Roti Bakar Keju Coklat',
            category: 'Snack',
            buyPrice: 7000,
            sellPrice: 16000,
            stock: 2,
            image: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=300&q=80'
        }
    ];

    // --- AKUN TOKO (kata sandi disimpan sebagai hash, bukan teks biasa) ---
    // Bima  / Bima123   (pemilik toko)
    // kasir / Kasir2026! (kasir)
    const DEFAULT_ACCOUNTS = [
        {
            id: 'USR-001',
            username: 'Bima',
            name: 'Bima Ramadhan Kartika',
            role: 'owner',
            position: 'Pemilik Toko',
            initials: 'BR',
            salt: 'kp-owner-7f3a',
            passwordHash: '91b71da9b2fc6eb779e5081034e15e98a0d54121f4d8642c4eecf392cbe1ae52',
            passwordHashFallback: 'a2e77eb1'
        },
        {
            id: 'USR-002',
            username: 'kasir',
            name: 'Gibran',
            role: 'cashier',
            position: 'Kasir',
            initials: 'G',
            salt: 'kp-kasir-2d9c',
            passwordHash: '7c80fac5a35ffb202fc985f01329da68a150364c4ff6ef169c8ba2b5c38258ad',
            passwordHashFallback: 'f86e5d8b'
        }
    ];

    const ROLE_LABELS = {
        owner: 'Owner',
        cashier: 'Kasir'
    };

    const STORAGE_KEYS = {
        accounts: 'kasirpro_accounts',
        products: 'kasirpro_products',
        transactions: 'kasirpro_transactions',
        session: 'kasirpro_session',
        version: 'kasirpro_data_version'
    };

    // Versi 3: pakai akun default Bima / Bima123
    const DATA_VERSION = '3';

    // --- APPLICATION STATE ---
    let state = {
        accounts: [],
        currentUser: null,
        products: [],
        transactions: [],
        cart: [],
        currentCategory: 'all',
        discountPercent: 0,
        activeTxForReceipt: null,
        charts: {}
    };

    // --- LOCAL STORAGE MANAGER ---
    function initData() {
        // Naik dari versi lama: paksa pakai akun default terbaru.
        // Transaksi & produk disimpan, akun lama dihapus sekali saja.
        const previousVersion = parseInt(localStorage.getItem(STORAGE_KEYS.version), 10);
        if (previousVersion !== DATA_VERSION) {
            if (previousVersion < 3) {
                localStorage.removeItem(STORAGE_KEYS.accounts);
                localStorage.removeItem(STORAGE_KEYS.session);
                sessionStorage.removeItem(STORAGE_KEYS.session);
            }
            localStorage.removeItem(STORAGE_KEYS.products);
            localStorage.removeItem(STORAGE_KEYS.transactions);
            localStorage.setItem(STORAGE_KEYS.version, DATA_VERSION);
        }

        const storedAccounts = localStorage.getItem(STORAGE_KEYS.accounts);
        if (!storedAccounts) {
            state.accounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
            saveAccounts();
        } else {
            state.accounts = JSON.parse(storedAccounts);
        }

        const storedProducts = localStorage.getItem(STORAGE_KEYS.products);
        if (!storedProducts) {
            state.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
            saveProducts();
        } else {
            state.products = JSON.parse(storedProducts);
        }

        // Ganti gambar fries lama dengan file lokal tanpa menghapus transaksi
        const fries = state.products.find(p => p.id === 'PROD-005');
        if (fries && fries.image.includes('images.unsplash.com/photo-1576107232684')) {
            fries.image = 'assets/images/french-fries.jpg';
            saveProducts();
        }

        // Transaksi selalu berasal dari transaksi nyata yang diproses di kasir
        const storedTransactions = localStorage.getItem(STORAGE_KEYS.transactions);
        state.transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
        saveTransactions();
    }

    function saveAccounts() {
        localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(state.accounts));
    }

    function saveProducts() {
        localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(state.products));
    }

    function saveTransactions() {
        localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(state.transactions));
    }

    // --- AUTHENTICATION ---
    function fallbackHash(value) {
        let hash = 0x811c9dc5;
        for (let i = 0; i < value.length; i++) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return hash.toString(16).padStart(8, '0');
    }

    async function hashPassword(password, salt) {
        const source = `${salt}:${password}`;
        if (window.crypto && window.crypto.subtle) {
            const buffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
            const hex = Array.from(new Uint8Array(buffer))
                .map(byte => byte.toString(16).padStart(2, '0'))
                .join('');
            return { method: 'sha256', value: hex };
        }
        return { method: 'fallback', value: fallbackHash(source) };
    }

    function showLoginError(message) {
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = message;
        errorEl.classList.add('visible');

        const card = document.querySelector('.login-card');
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
    }

    function clearLoginError() {
        document.getElementById('login-error').classList.remove('visible');
        document.getElementById('login-error').textContent = '';
    }

    function rememberSession(userId, remember) {
        localStorage.removeItem(STORAGE_KEYS.session);
        sessionStorage.removeItem(STORAGE_KEYS.session);
        (remember ? localStorage : sessionStorage).setItem(STORAGE_KEYS.session, userId);
    }

    function getStoredSession() {
        return localStorage.getItem(STORAGE_KEYS.session) || sessionStorage.getItem(STORAGE_KEYS.session);
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_KEYS.session);
        sessionStorage.removeItem(STORAGE_KEYS.session);
    }

    function greetingText() {
        const hour = new Date().getHours();
        if (hour < 11) return 'Selamat pagi';
        if (hour < 15) return 'Selamat siang';
        if (hour < 18) return 'Selamat sore';
        return 'Selamat malam';
    }

    function applyRoleUI() {
        const role = state.currentUser ? state.currentUser.role : null;
        document.querySelectorAll('.nav-item[data-roles]').forEach(item => {
            const allowed = item.getAttribute('data-roles').split(',').map(r => r.trim());
            item.hidden = !allowed.includes(role);
        });
        document.getElementById('btn-reset-app').hidden = role !== 'owner';
    }

    function makeInitials(name) {
        return name.trim().split(/\s+/).slice(0, 2)
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase();
    }

    function renderUserIdentity() {
        const user = state.currentUser;
        if (!user) return;

        user.initials = makeInitials(user.name);
        document.getElementById('sidebar-avatar').textContent = user.initials;
        document.getElementById('sidebar-user-name').textContent = user.name;
        document.getElementById('sidebar-user-role').textContent = user.position;
        document.getElementById('header-greeting').innerHTML =
            `<span class="greeting-dot"></span> ${greetingText()}, ${user.name.split(' ')[0]}`;

        const rolePill = document.getElementById('header-role-pill');
        rolePill.className = `header-role-pill ${user.role}`;
        rolePill.innerHTML = `<i class="fa-solid ${user.role === 'owner' ? 'fa-user-shield' : 'fa-cash-register'}"></i><span>${ROLE_LABELS[user.role]}</span>`;
    }

    function enterApp(user) {
        state.currentUser = user;

        document.getElementById('login-view').classList.remove('active');
        document.querySelector('.app-container').classList.add('app-visible');

        renderUserIdentity();
        applyRoleUI();

        const activeNav = document.querySelector('.nav-item.active');
        if (!activeNav || activeNav.hidden) {
            const firstAllowed = Array.from(document.querySelectorAll('.nav-item')).find(item => !item.hidden);
            if (firstAllowed) firstAllowed.click();
        } else {
            const activeTarget = activeNav.getAttribute('data-target');
            if (activeTarget === 'dashboard-view') renderDashboard();
            if (activeTarget === 'pos-view') renderPOSView();
            if (activeTarget === 'reports-view') renderReportsView();
            if (activeTarget === 'history-view') renderHistoryView();
            if (activeTarget === 'products-view') renderProductsView();
        }
    }

    function showLoginScreen() {
        state.currentUser = null;
        state.cart = [];
        state.discountPercent = 0;
        document.getElementById('cart-discount-input').value = 0;

        document.querySelector('.app-container').classList.remove('app-visible');
        document.getElementById('login-view').classList.add('active');

        document.getElementById('login-form').reset();
        document.getElementById('login-password').type = 'password';
        document.getElementById('btn-toggle-password').innerHTML = '<i class="fa-regular fa-eye"></i>';
        clearLoginError();
    }

    function setupAuth() {
        const form = document.getElementById('login-form');
        const submitBtn = document.getElementById('btn-login-submit');
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const rememberInput = document.getElementById('login-remember');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearLoginError();

            const username = usernameInput.value.trim().toLowerCase();
            const password = passwordInput.value;
            if (!username || !password) {
                showLoginError('Username dan kata sandi wajib diisi.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.querySelector('span').textContent = 'Memeriksa akun...';

            const account = state.accounts.find(a => a.username.toLowerCase() === username);
            const hashed = await hashPassword(password, account ? account.salt : 'kasirpro');
            const expected = account
                ? (hashed.method === 'sha256' ? account.passwordHash : account.passwordHashFallback)
                : null;

            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Masuk Sekarang';

            if (!account || hashed.value !== expected) {
                passwordInput.value = '';
                passwordInput.focus();
                showLoginError('Username atau kata sandi salah. Silakan coba lagi.');
                return;
            }

            rememberSession(account.id, rememberInput.checked);
            enterApp(account);
            showToast(`Selamat datang, ${account.name}!`, 'success');
        });

        document.getElementById('btn-toggle-password').addEventListener('click', (event) => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            event.currentTarget.innerHTML = `<i class="fa-regular fa-${isPassword ? 'eye-slash' : 'eye'}"></i>`;
            passwordInput.focus();
        });

        document.getElementById('btn-logout').addEventListener('click', () => {
            clearSession();
            showLoginScreen();
            showToast('Anda telah keluar dari akun', 'success');
        });
    }

    // --- PENGATURAN AKUN ---
    function showAccountError(message) {
        const el = document.getElementById('account-error');
        el.textContent = message;
        el.classList.add('visible');
    }

    function clearAccountError() {
        const el = document.getElementById('account-error');
        el.textContent = '';
        el.classList.remove('visible');
    }

    function openAccountModal() {
        if (!state.currentUser) return;
        clearAccountError();

        document.getElementById('acc-name').value = state.currentUser.name;
        document.getElementById('acc-username').value = state.currentUser.username;
        ['acc-current-password', 'acc-new-password', 'acc-confirm-password'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('btn-reset-account').hidden = state.currentUser.role !== 'owner';

        document.getElementById('modal-account').classList.add('active');
    }

    function setupAccountHandlers() {
        document.getElementById('btn-account-settings').addEventListener('click', openAccountModal);
        document.getElementById('sidebar-user-profile').addEventListener('click', openAccountModal);

        document.getElementById('btn-reset-account').addEventListener('click', () => {
            if (!confirm('Kembalikan nama, username, dan password akun ke nilai bawaan di kode?')) return;

            localStorage.removeItem(STORAGE_KEYS.accounts);
            clearSession();
            initData();
            document.getElementById('modal-account').classList.remove('active');
            showLoginScreen();
            showToast('Akun dikembalikan ke nilai bawaan', 'success');
        });

        document.getElementById('form-account').addEventListener('submit', async (event) => {
            event.preventDefault();
            clearAccountError();

            const user = state.currentUser;
            if (!user) return;

            const name = document.getElementById('acc-name').value.trim();
            const username = document.getElementById('acc-username').value.trim().toLowerCase();
            const currentPassword = document.getElementById('acc-current-password').value;
            const newPassword = document.getElementById('acc-new-password').value;
            const confirmPassword = document.getElementById('acc-confirm-password').value;

            if (!name || !username) {
                showAccountError('Nama dan username wajib diisi.');
                return;
            }

            const usernameTaken = state.accounts.some(a => a.id !== user.id && a.username.toLowerCase() === username);
            if (usernameTaken) {
                showAccountError('Username sudah digunakan akun lain.');
                return;
            }

            const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmPassword);
            if (wantsPasswordChange) {
                if (!currentPassword || !newPassword || !confirmPassword) {
                    showAccountError('Lengkapi semua kolom kata sandi.');
                    return;
                }

                const hashedCurrent = await hashPassword(currentPassword, user.salt);
                const expectedCurrent = hashedCurrent.method === 'sha256' ? user.passwordHash : user.passwordHashFallback;
                if (hashedCurrent.value !== expectedCurrent) {
                    showAccountError('Kata sandi saat ini tidak benar.');
                    return;
                }
                if (newPassword.length < 6) {
                    showAccountError('Kata sandi baru minimal 6 karakter.');
                    return;
                }
                if (newPassword !== confirmPassword) {
                    showAccountError('Konfirmasi kata sandi tidak cocok.');
                    return;
                }
            }

            user.name = name;
            user.username = username;

            if (wantsPasswordChange) {
                const hashedNew = await hashPassword(newPassword, user.salt);
                if (hashedNew.method === 'sha256') user.passwordHash = hashedNew.value;
                user.passwordHashFallback = fallbackHash(`${user.salt}:${newPassword}`);
            }

            saveAccounts();
            renderUserIdentity();
            document.getElementById('modal-account').classList.remove('active');
            showToast(wantsPasswordChange ? 'Profil dan kata sandi berhasil diperbarui' : 'Profil berhasil diperbarui', 'success');
        });
    }

    // --- UTILITY FUNCTIONS ---
    function formatRp(amount) {
        return 'Rp ' + Math.round(amount || 0).toLocaleString('id-ID');
    }

    function formatDate(dateString) {
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function isToday(dateString) {
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-check-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        if (type === 'danger') icon = 'fa-times-circle';

        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- CLOCK CONTROLLER ---
    function startClock() {
        const timeEl = document.getElementById('current-time');
        const dateEl = document.getElementById('current-date');

        function update() {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('id-ID');
            dateEl.textContent = now.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
        update();
        setInterval(update, 1000);
    }

    // --- NAVIGATION CONTROLLER ---
    function setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-item');
        const viewSections = document.querySelectorAll('.view-section');
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');

        const titleMap = {
            'dashboard-view': { title: 'Dashboard Management', subtitle: 'Ringkasan performa toko & statistik harian real-time' },
            'pos-view': { title: 'POS / Menu Kasir Utama', subtitle: 'Pilih produk, proses keranjang belanja, & cetak struk nota' },
            'reports-view': { title: 'Laporan Penjualan', subtitle: 'Analisis pendapatan, keuntungan harian/bulanan, & export data' },
            'history-view': { title: 'Log Transaksi (Riwayat)', subtitle: 'Daftar riwayat seluruh nota penjualan & cetak ulang struk' },
            'products-view': { title: 'Manajemen Produk Master', subtitle: 'Kelola catalog produk, tambah stok, & harga jual' }
        };

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');

                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                viewSections.forEach(sec => sec.classList.remove('active'));
                const targetSec = document.getElementById(targetId);
                if (targetSec) targetSec.classList.add('active');

                if (titleMap[targetId]) {
                    pageTitle.textContent = titleMap[targetId].title;
                    pageSubtitle.textContent = titleMap[targetId].subtitle;
                }

                // Trigger specific view renders
                if (targetId === 'dashboard-view') renderDashboard();
                if (targetId === 'pos-view') renderPOSView();
                if (targetId === 'reports-view') renderReportsView();
                if (targetId === 'history-view') renderHistoryView();
                if (targetId === 'products-view') renderProductsView();
            });
        });

        document.getElementById('btn-quick-pos').addEventListener('click', () => {
            document.querySelector('[data-target="pos-view"]').click();
        });

        document.getElementById('btn-goto-products').addEventListener('click', () => {
            document.querySelector('[data-target="products-view"]').click();
        });

        // Reset data transaksi & stok ke kondisi awal (khusus pemilik toko)
        document.getElementById('btn-reset-app').addEventListener('click', () => {
            if (state.currentUser && state.currentUser.role !== 'owner') {
                showToast('Hanya pemilik toko yang bisa mereset data', 'danger');
                return;
            }
            if (confirm('Reset seluruh transaksi dan stok ke data awal? Akun tidak akan terhapus.')) {
                localStorage.removeItem(STORAGE_KEYS.products);
                localStorage.removeItem(STORAGE_KEYS.transactions);
                state.cart = [];
                state.discountPercent = 0;
                document.getElementById('cart-discount-input').value = 0;
                initData();
                renderDashboard();
                showToast('Data toko berhasil di-reset', 'success');
            }
        });
    }

    // --- MODULE 1: DASHBOARD RENDERER ---
    function renderDashboard() {
        // Calculate Today's Metrics
        let todayItemsSold = 0;
        let todayRevenue = 0;
        let todayProfit = 0;

        state.transactions.forEach(tx => {
            if (isToday(tx.timestamp)) {
                todayRevenue += tx.grandTotal;
                todayProfit += tx.profit;
                tx.items.forEach(item => {
                    todayItemsSold += item.qty;
                });
            }
        });

        // Calculate Total Stock & Low Stock
        let totalStock = 0;
        let lowStockItems = [];

        state.products.forEach(p => {
            totalStock += p.stock;
            if (p.stock <= 5) {
                lowStockItems.push(p);
            }
        });

        // Render KPI Cards
        document.getElementById('dash-items-sold').textContent = `${todayItemsSold} Unit`;
        document.getElementById('dash-revenue').textContent = formatRp(todayRevenue);
        document.getElementById('dash-profit').textContent = formatRp(todayProfit);
        document.getElementById('dash-total-stock').textContent = `${totalStock} Unit`;
        document.getElementById('dash-low-stock-count').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${lowStockItems.length} stok menipis`;

        // Render Top Products Widget
        renderTopProductsWidget();

        // Render Low Stock Table
        renderLowStockTable(lowStockItems);

        // Render Sales Trends Chart
        renderDashboardChart();
    }

    function renderTopProductsWidget() {
        const container = document.getElementById('dash-top-products');
        container.innerHTML = '';

        // Calculate sales count per product
        const productSales = {};
        state.transactions.forEach(tx => {
            tx.items.forEach(item => {
                productSales[item.name] = (productSales[item.name] || 0) + item.qty;
            });
        });

        const sorted = Object.keys(productSales)
            .map(name => ({ name, qty: productSales[name] }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 4);

        if (sorted.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Belum ada data penjualan</p>';
            return;
        }

        sorted.forEach(item => {
            const prodObj = state.products.find(p => p.name === item.name) || { image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80' };
            const div = document.createElement('div');
            div.className = 'top-product-item';
            div.innerHTML = `
                <div class="top-prod-info">
                    <img src="${prodObj.image}" class="top-prod-img" alt="${item.name}">
                    <div>
                        <div class="top-prod-name">${item.name}</div>
                        <div class="top-prod-sales">${item.qty} unit terjual</div>
                    </div>
                </div>
                <span class="badge-stock safe"><i class="fa-solid fa-fire"></i> Top Sell</span>
            `;
            container.appendChild(div);
        });
    }

    function renderLowStockTable(lowItems) {
        const tbody = document.getElementById('dash-low-stock-body');
        tbody.innerHTML = '';

        if (lowItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Semua stok produk dalam kondisi aman (&gt; 5 unit)</td></tr>`;
            return;
        }

        lowItems.forEach(p => {
            const tr = document.createElement('tr');
            const statusBadge = p.stock === 0 ? 
                `<span class="badge-stock empty">Habis (0)</span>` : 
                `<span class="badge-stock low">Menipis (${p.stock})</span>`;

            tr.innerHTML = `
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>${formatRp(p.sellPrice)}</td>
                <td class="bold text-warning">${p.stock}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline btn-quick-add-stock" data-id="${p.id}">
                        <i class="fa-solid fa-plus"></i> +10 Stok
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add Quick Add Stock Handler
        tbody.querySelectorAll('.btn-quick-add-stock').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const product = state.products.find(p => p.id === id);
                if (product) {
                    product.stock += 10;
                    saveProducts();
                    renderDashboard();
                    showToast(`Stok ${product.name} berhasil ditambah +10`, 'success');
                }
            });
        });
    }

    function renderDashboardChart() {
        const ctx = document.getElementById('salesTrendsChart').getContext('2d');

        // Build last 7 days labels
        const labels = [];
        const revenueData = [];
        const profitData = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            labels.push(dateStr);

            let dayRev = 0;
            let dayProf = 0;

            state.transactions.forEach(tx => {
                const txDate = new Date(tx.timestamp);
                if (txDate.getDate() === d.getDate() &&
                    txDate.getMonth() === d.getMonth() &&
                    txDate.getFullYear() === d.getFullYear()) {
                    dayRev += tx.grandTotal;
                    dayProf += tx.profit;
                }
            });

            revenueData.push(dayRev);
            profitData.push(dayProf);
        }

        if (state.charts.dashChart) {
            state.charts.dashChart.destroy();
        }

        state.charts.dashChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Omset / Pendapatan (Rp)',
                        data: revenueData,
                        backgroundColor: '#6366f1',
                        borderRadius: 6
                    },
                    {
                        label: 'Keuntungan Bersih (Rp)',
                        data: profitData,
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } } }
                },
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
                    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }

    // --- MODULE 2: POS KASIR CONTROLLER ---
    function renderPOSView() {
        renderPOSCategories();
        renderPOSProducts();
        renderCartUI();
    }

    function renderPOSCategories() {
        const container = document.getElementById('pos-categories');
        const categories = ['all', ...new Set(state.products.map(p => p.category))];

        container.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `pill-btn ${state.currentCategory === cat ? 'active' : ''}`;
            btn.setAttribute('data-category', cat);
            btn.textContent = cat === 'all' ? 'Semua Produk' : cat;
            btn.addEventListener('click', () => {
                state.currentCategory = cat;
                renderPOSCategories();
                renderPOSProducts();
            });
            container.appendChild(btn);
        });
    }

    function renderPOSProducts() {
        const grid = document.getElementById('pos-products-grid');
        const searchQuery = document.getElementById('pos-search').value.toLowerCase().trim();

        grid.innerHTML = '';

        const filtered = state.products.filter(p => {
            const matchCategory = state.currentCategory === 'all' || p.category === state.currentCategory;
            const matchSearch = p.name.toLowerCase().includes(searchQuery) || p.id.toLowerCase().includes(searchQuery);
            return matchCategory && matchSearch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-2 text-center text-muted padding-lg">Tidak ada produk ditemukan</div>`;
            return;
        }

        filtered.forEach(p => {
            const isOutOfStock = p.stock <= 0;
            const card = document.createElement('div');
            card.className = `product-card ${isOutOfStock ? 'out-of-stock' : ''}`;
            card.innerHTML = `
                <div class="prod-img-wrapper">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                    <span class="prod-stock-tag ${p.stock <= 5 ? 'text-warning' : ''}">Stok: ${p.stock}</span>
                </div>
                <div class="prod-info-box">
                    <div class="prod-title">${p.name}</div>
                    <div class="prod-category">${p.category}</div>
                    <div class="prod-price">${formatRp(p.sellPrice)}</div>
                </div>
            `;

            if (!isOutOfStock) {
                card.addEventListener('click', () => addToCart(p.id));
            }

            grid.appendChild(card);
        });
    }

    function addToCart(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        const cartItem = state.cart.find(item => item.product.id === productId);
        const currentQtyInCart = cartItem ? cartItem.qty : 0;

        if (currentQtyInCart + 1 > product.stock) {
            showToast(`Stok ${product.name} tidak mencukupi!`, 'warning');
            return;
        }

        if (cartItem) {
            cartItem.qty += 1;
        } else {
            state.cart.push({ product, qty: 1 });
        }

        renderCartUI();
        showToast(`+ ${product.name} ditambahkan`, 'success');
    }

    function renderCartUI() {
        const list = document.getElementById('cart-items-list');
        const badgeCount = document.getElementById('nav-cart-count');
        list.innerHTML = '';

        let subtotal = 0;
        let totalItems = 0;

        if (state.cart.length === 0) {
            list.innerHTML = `
                <div class="empty-cart-box">
                    <i class="fa-solid fa-basket-shopping"></i>
                    <p>Keranjang masih kosong</p>
                    <span class="text-xs">Klik produk di catalog untuk menambahkan</span>
                </div>
            `;
            badgeCount.textContent = '0';
        } else {
            state.cart.forEach((item, index) => {
                const itemTotal = item.product.sellPrice * item.qty;
                subtotal += itemTotal;
                totalItems += item.qty;

                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div class="cart-item-details">
                        <span class="cart-item-title">${item.product.name}</span>
                        <span class="cart-item-price">${formatRp(item.product.sellPrice)} x ${item.qty}</span>
                    </div>
                    <div class="cart-qty-controls">
                        <button class="qty-btn btn-minus" data-index="${index}"><i class="fa-solid fa-minus"></i></button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn btn-plus" data-index="${index}"><i class="fa-solid fa-plus"></i></button>
                    </div>
                `;
                list.appendChild(div);
            });
            badgeCount.textContent = totalItems.toString();
        }

        // Calculate Discount & Grand Total
        const discountInput = document.getElementById('cart-discount-input');
        state.discountPercent = parseFloat(discountInput.value) || 0;
        
        const discountAmount = (subtotal * state.discountPercent) / 100;
        const grandTotal = Math.max(0, subtotal - discountAmount);

        document.getElementById('cart-subtotal').textContent = formatRp(subtotal);
        document.getElementById('cart-discount-amount').textContent = `- ${formatRp(discountAmount)}`;
        document.getElementById('cart-grand-total').textContent = formatRp(grandTotal);

        // Cart Event Listeners
        list.querySelectorAll('.btn-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = btn.getAttribute('data-index');
                if (state.cart[idx].qty > 1) {
                    state.cart[idx].qty -= 1;
                } else {
                    state.cart.splice(idx, 1);
                }
                renderCartUI();
            });
        });

        list.querySelectorAll('.btn-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = btn.getAttribute('data-index');
                const product = state.cart[idx].product;
                if (state.cart[idx].qty + 1 > product.stock) {
                    showToast(`Sisa stok ${product.name} hanya ${product.stock}`, 'warning');
                    return;
                }
                state.cart[idx].qty += 1;
                renderCartUI();
            });
        });
    }

    function setupPOSHandlers() {
        // Search & Clear Search
        const searchInput = document.getElementById('pos-search');
        const clearBtn = document.getElementById('btn-clear-search');

        searchInput.addEventListener('input', () => {
            clearBtn.style.display = searchInput.value ? 'block' : 'none';
            renderPOSProducts();
        });

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            renderPOSProducts();
        });

        // Discount Input Handler
        document.getElementById('cart-discount-input').addEventListener('input', renderCartUI);

        // Clear Cart
        document.getElementById('btn-clear-cart').addEventListener('click', () => {
            if (state.cart.length > 0 && confirm('Kosongkan keranjang belanja?')) {
                state.cart = [];
                renderCartUI();
            }
        });

        // Open Checkout Modal
        document.getElementById('btn-open-checkout').addEventListener('click', () => {
            if (state.cart.length === 0) {
                showToast('Keranjang belanja masih kosong!', 'warning');
                return;
            }
            openCheckoutModal();
        });
    }

    // --- CHECKOUT & PAYMENT MODAL ---
    function openCheckoutModal() {
        const modal = document.getElementById('modal-checkout');
        modal.classList.add('active');

        let subtotal = state.cart.reduce((acc, item) => acc + (item.product.sellPrice * item.qty), 0);
        let discountAmount = (subtotal * state.discountPercent) / 100;
        let grandTotal = Math.max(0, subtotal - discountAmount);

        document.getElementById('checkout-total-display').textContent = formatRp(grandTotal);
        
        const cashInput = document.getElementById('cash-given-input');
        cashInput.value = grandTotal;
        calculateChange(grandTotal);

        // Quick Cash Chips Handler
        document.querySelectorAll('.chip-btn').forEach(btn => {
            btn.onclick = () => {
                const val = btn.getAttribute('data-val');
                if (val === 'exact') {
                    cashInput.value = grandTotal;
                } else {
                    cashInput.value = parseInt(val);
                }
                calculateChange(grandTotal);
            };
        });

        cashInput.oninput = () => calculateChange(grandTotal);
    }

    function calculateChange(grandTotal) {
        const cashGiven = parseFloat(document.getElementById('cash-given-input').value) || 0;
        const change = cashGiven - grandTotal;
        const changeDisplay = document.getElementById('cash-change-display');

        if (change < 0) {
            changeDisplay.textContent = 'Uang Kurang';
            changeDisplay.className = 'text-danger';
        } else {
            changeDisplay.textContent = formatRp(change);
            changeDisplay.className = 'text-success';
        }
    }

    function setupCheckoutHandlers() {
        // Radio Payment Method Switch
        document.querySelectorAll('input[name="pay-method"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const val = e.target.value;
                document.querySelectorAll('.pay-method-card').forEach(card => card.classList.remove('active'));
                e.target.closest('.pay-method-card').classList.add('active');

                document.getElementById('cash-payment-section').style.display = val === 'Tunai' ? 'block' : 'none';
                document.getElementById('qris-payment-section').style.display = val === 'QRIS' ? 'block' : 'none';
            });
        });

        // Close Modals
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
            });
        });

        // Process Payment Submit
        document.getElementById('btn-process-pay').addEventListener('click', () => {
            let subtotal = state.cart.reduce((acc, item) => acc + (item.product.sellPrice * item.qty), 0);
            let discountAmount = (subtotal * state.discountPercent) / 100;
            let grandTotal = Math.max(0, subtotal - discountAmount);

            const selectedMethod = document.querySelector('input[name="pay-method"]:checked').value;
            let cashGiven = grandTotal;
            let change = 0;

            if (selectedMethod === 'Tunai') {
                cashGiven = parseFloat(document.getElementById('cash-given-input').value) || 0;
                if (cashGiven < grandTotal) {
                    showToast('Jumlah uang yang dimasukkan kurang!', 'danger');
                    return;
                }
                change = cashGiven - grandTotal;
            }

            // Calculate profit
            let totalBuyCost = state.cart.reduce((acc, item) => acc + (item.product.buyPrice * item.qty), 0);
            let profit = grandTotal - totalBuyCost;

            // Generate Transaction ID berdasarkan nota terbesar yang pernah ada
            const lastIdNumber = state.transactions.reduce((max, tx) => {
                const number = parseInt(String(tx.id).replace(/\D/g, ''), 10);
                return Number.isNaN(number) ? max : Math.max(max, number);
            }, 1000);
            const newTxId = 'TX-' + (lastIdNumber + 1);

            // Deduct Stocks
            state.cart.forEach(cartItem => {
                const p = state.products.find(prod => prod.id === cartItem.product.id);
                if (p) p.stock -= cartItem.qty;
            });
            saveProducts();

            // Create Transaction Record
            const transactionRecord = {
                id: newTxId,
                timestamp: new Date().toISOString(),
                items: state.cart.map(item => ({
                    id: item.product.id,
                    name: item.product.name,
                    qty: item.qty,
                    buyPrice: item.product.buyPrice,
                    sellPrice: item.product.sellPrice
                })),
                subtotal: subtotal,
                discountPercent: state.discountPercent,
                discountAmount: discountAmount,
                grandTotal: grandTotal,
                profit: profit,
                paymentMethod: selectedMethod,
                cashGiven: cashGiven,
                change: change,
                cashierId: state.currentUser ? state.currentUser.id : null,
                cashierName: state.currentUser ? state.currentUser.name : '-'
            };

            state.transactions.unshift(transactionRecord);
            saveTransactions();

            // Close checkout modal & Reset Cart
            document.getElementById('modal-checkout').classList.remove('active');
            state.cart = [];
            document.getElementById('cart-discount-input').value = 0;
            renderCartUI();
            renderPOSProducts();

            // Show Receipt Modal
            openReceiptModal(transactionRecord);
            showToast('Transaksi Berhasil Ditambahkan!', 'success');
        });
    }

    // --- RECEIPT MODAL ---
    function openReceiptModal(tx) {
        state.activeTxForReceipt = tx;
        const modal = document.getElementById('modal-receipt');
        modal.classList.add('active');

        document.getElementById('rec-id').textContent = '#' + tx.id;
        document.getElementById('rec-date').textContent = formatDate(tx.timestamp);
        document.getElementById('rec-payment').textContent = tx.paymentMethod;
        document.getElementById('rec-cashier').textContent = tx.cashierName || '-';

        const tbody = document.getElementById('rec-items-tbody');
        tbody.innerHTML = '';

        tx.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="2">
                    <div><strong>${item.name}</strong></div>
                    <div>${item.qty} x ${formatRp(item.sellPrice)}</div>
                </td>
                <td style="text-align:right; vertical-align:bottom;">${formatRp(item.qty * item.sellPrice)}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('rec-subtotal').textContent = formatRp(tx.subtotal);
        document.getElementById('rec-discount').textContent = formatRp(tx.discountAmount);
        document.getElementById('rec-grandtotal').textContent = formatRp(tx.grandTotal);
        document.getElementById('rec-paid').textContent = formatRp(tx.cashGiven);
        document.getElementById('rec-change').textContent = formatRp(tx.change);
    }

    function setupReceiptHandlers() {
        document.getElementById('btn-print-receipt-action').addEventListener('click', () => {
            window.print();
        });
    }

    // --- MODULE 3: LAPORAN PENJUALAN CONTROLLER ---
    function renderReportsView() {
        const period = document.getElementById('report-period-select').value;
        const filteredTx = filterTransactionsByPeriod(period);

        let totalTx = filteredTx.length;
        let totalRevenue = 0;
        let totalProfit = 0;

        filteredTx.forEach(tx => {
            totalRevenue += tx.grandTotal;
            totalProfit += tx.profit;
        });

        let avgTx = totalTx > 0 ? totalRevenue / totalTx : 0;

        document.getElementById('rep-total-tx').textContent = `${totalTx} Transaksi`;
        document.getElementById('rep-total-revenue').textContent = formatRp(totalRevenue);
        document.getElementById('rep-total-profit').textContent = formatRp(totalProfit);
        document.getElementById('rep-avg-tx').textContent = formatRp(avgTx);

        // Render Product breakdown table
        renderReportTable(filteredTx);

        // Render Charts
        renderReportCharts(filteredTx);
    }

    function filterTransactionsByPeriod(period) {
        const now = new Date();
        return state.transactions.filter(tx => {
            const d = new Date(tx.timestamp);
            if (period === 'today') {
                return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }
            if (period === 'this-month') {
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }
            if (period === 'last-month') {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
            }
            return true; // 'all-time'
        });
    }

    function renderReportTable(transactions) {
        const tbody = document.getElementById('report-product-tbody');
        tbody.innerHTML = '';

        // Consolidate sales per product
        const productStats = {};

        transactions.forEach(tx => {
            tx.items.forEach(item => {
                if (!productStats[item.name]) {
                    const prodObj = state.products.find(p => p.name === item.name) || { category: 'Umum' };
                    productStats[item.name] = {
                        category: prodObj.category,
                        buyPrice: item.buyPrice,
                        sellPrice: item.sellPrice,
                        totalQty: 0,
                        totalRevenue: 0,
                        totalProfit: 0
                    };
                }
                productStats[item.name].totalQty += item.qty;
                const rev = item.sellPrice * item.qty;
                const prof = (item.sellPrice - item.buyPrice) * item.qty;
                productStats[item.name].totalRevenue += rev;
                productStats[item.name].totalProfit += prof;
            });
        });

        const sortedNames = Object.keys(productStats).sort((a, b) => productStats[b].totalRevenue - productStats[a].totalRevenue);

        if (sortedNames.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Belum ada transaksi pada periode ini</td></tr>`;
            return;
        }

        sortedNames.forEach(name => {
            const stat = productStats[name];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${name}</strong></td>
                <td>${stat.category}</td>
                <td>${formatRp(stat.buyPrice)}</td>
                <td>${formatRp(stat.sellPrice)}</td>
                <td class="bold">${stat.totalQty}</td>
                <td class="bold text-primary">${formatRp(stat.totalRevenue)}</td>
                <td class="bold text-success">${formatRp(stat.totalProfit)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderReportCharts(transactions) {
        // Main Trend Chart
        const mainCtx = document.getElementById('reportMainChart').getContext('2d');
        const datesMap = {};

        transactions.forEach(tx => {
            const d = new Date(tx.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            if (!datesMap[d]) datesMap[d] = { rev: 0, prof: 0 };
            datesMap[d].rev += tx.grandTotal;
            datesMap[d].prof += tx.profit;
        });

        const labels = Object.keys(datesMap);
        const revData = labels.map(l => datesMap[l].rev);
        const profData = labels.map(l => datesMap[l].prof);

        if (state.charts.reportMain) state.charts.reportMain.destroy();

        state.charts.reportMain = new Chart(mainCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Omset', data: revData, borderColor: '#6366f1', tension: 0.3, fill: false },
                    { label: 'Profit', data: profData, borderColor: '#10b981', tension: 0.3, fill: false }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#9ca3af' } } },
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
                    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });

        // Category Doughnut Chart
        const catCtx = document.getElementById('reportCategoryChart').getContext('2d');
        const catMap = {};

        transactions.forEach(tx => {
            tx.items.forEach(item => {
                const prod = state.products.find(p => p.name === item.name) || { category: 'Lainnya' };
                catMap[prod.category] = (catMap[prod.category] || 0) + (item.sellPrice * item.qty);
            });
        });

        if (state.charts.reportCat) state.charts.reportCat.destroy();

        state.charts.reportCat = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(catMap),
                datasets: [{
                    data: Object.values(catMap),
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } }
            }
        });
    }

    function setupReportHandlers() {
        document.getElementById('report-period-select').addEventListener('change', renderReportsView);

        // Export CSV
        document.getElementById('btn-export-csv').addEventListener('click', () => {
            const period = document.getElementById('report-period-select').value;
            const transactions = filterTransactionsByPeriod(period);

            let csvContent = 'data:text/csv;charset=utf-8,ID Transaksi,Waktu,Total Pembayaran,Keuntungan,Metode Bayar\n';
            transactions.forEach(tx => {
                csvContent += `${tx.id},"${formatDate(tx.timestamp)}",${tx.grandTotal},${tx.profit},${tx.paymentMethod}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `Laporan_Penjualan_KasirPro_${period}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Laporan CSV berhasil diunduh', 'success');
        });

        document.getElementById('btn-print-report').addEventListener('click', () => window.print());
    }

    // --- MODULE 4: LOG TRANSAKSI CONTROLLER ---
    function renderHistoryView() {
        const tbody = document.getElementById('history-tbody');
        const searchQuery = document.getElementById('history-search').value.toLowerCase().trim();
        const dateFilter = document.getElementById('history-date-filter').value;

        tbody.innerHTML = '';

        const filtered = state.transactions.filter(tx => {
            const matchSearch = tx.id.toLowerCase().includes(searchQuery) ||
                tx.paymentMethod.toLowerCase().includes(searchQuery) ||
                (tx.cashierName || '').toLowerCase().includes(searchQuery);
            let matchDate = true;
            if (dateFilter) {
                const txDateStr = new Date(tx.timestamp).toISOString().split('T')[0];
                matchDate = txDateStr === dateFilter;
            }
            return matchSearch && matchDate;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Belum ada transaksi. Transaksi yang diproses di kasir akan muncul di sini.</td></tr>`;
            return;
        }

        filtered.forEach(tx => {
            const tr = document.createElement('tr');
            const itemsSummary = tx.items.map(i => `${i.name} (${i.qty})`).join(', ');

            tr.innerHTML = `
                <td><strong>#${tx.id}</strong></td>
                <td>${formatDate(tx.timestamp)}</td>
                <td style="max-width: 250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${itemsSummary}</td>
                <td class="bold text-primary">${formatRp(tx.grandTotal)}</td>
                <td><span class="badge-stock safe">${tx.paymentMethod}</span></td>
                <td>${tx.cashierName || '-'}</td>
                <td class="text-success bold">${formatRp(tx.profit)}</td>
                <td>
                    <div class="flex-center gap-xs">
                        <button class="btn btn-sm btn-outline btn-reprint" data-id="${tx.id}" title="Cetak Ulang Struk">
                            <i class="fa-solid fa-print"></i>
                        </button>
                        ${state.currentUser && state.currentUser.role === 'owner' ? `
                        <button class="btn btn-sm btn-outline text-danger btn-void-tx" data-id="${tx.id}" title="Batalkan Transaksi">
                            <i class="fa-solid fa-trash"></i>
                        </button>` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Event handlers for action buttons
        tbody.querySelectorAll('.btn-reprint').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const tx = state.transactions.find(t => t.id === id);
                if (tx) openReceiptModal(tx);
            };
        });

        tbody.querySelectorAll('.btn-void-tx').forEach(btn => {
            btn.onclick = () => {
                if (!state.currentUser || state.currentUser.role !== 'owner') {
                    showToast('Pembatalan transaksi hanya bisa dilakukan pemilik toko', 'danger');
                    return;
                }
                const id = btn.getAttribute('data-id');
                if (confirm(`Apakah Anda yakin ingin membatalkan transaksi #${id}? Stok produk akan dikembalikan.`)) {
                    const txIdx = state.transactions.findIndex(t => t.id === id);
                    if (txIdx !== -1) {
                        const tx = state.transactions[txIdx];
                        // Restore Stock
                        tx.items.forEach(item => {
                            const p = state.products.find(prod => prod.id === item.id);
                            if (p) p.stock += item.qty;
                        });
                        saveProducts();

                        state.transactions.splice(txIdx, 1);
                        saveTransactions();
                        renderHistoryView();
                        showToast(`Transaksi #${id} telah dibatalkan & stok dikembalikan`, 'success');
                    }
                }
            };
        });
    }

    function setupHistoryHandlers() {
        document.getElementById('history-search').addEventListener('input', renderHistoryView);
        document.getElementById('history-date-filter').addEventListener('change', renderHistoryView);
        document.getElementById('btn-reset-history-date').addEventListener('click', () => {
            document.getElementById('history-date-filter').value = '';
            renderHistoryView();
        });
    }

    // --- MODULE 5: MANAJEMEN PRODUK CONTROLLER ---
    function renderProductsView() {
        renderProductCategoryFilter();
        
        const tbody = document.getElementById('products-tbody');
        const searchQuery = document.getElementById('pm-search').value.toLowerCase().trim();
        const catFilter = document.getElementById('pm-category-filter').value;

        tbody.innerHTML = '';

        const filtered = state.products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(searchQuery) || p.id.toLowerCase().includes(searchQuery);
            const matchCat = catFilter === 'all' || p.category === catFilter;
            return matchSearch && matchCat;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Tidak ada produk dalam master data</td></tr>`;
            return;
        }

        filtered.forEach(p => {
            const margin = Math.round(((p.sellPrice - p.buyPrice) / p.sellPrice) * 100) || 0;
            const stockBadge = p.stock === 0 ? `<span class="badge-stock empty">Habis (0)</span>` :
                p.stock <= 5 ? `<span class="badge-stock low">Menipis (${p.stock})</span>` :
                `<span class="badge-stock safe">${p.stock} Unit</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${p.image}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;"></td>
                <td><strong>${p.name}</strong><br><span class="text-xs text-muted">${p.id}</span></td>
                <td>${p.category}</td>
                <td>${formatRp(p.buyPrice)}</td>
                <td class="bold text-primary">${formatRp(p.sellPrice)}</td>
                <td><span class="text-success bold">+${margin}%</span></td>
                <td>${stockBadge}</td>
                <td>
                    <div class="flex-center gap-xs">
                        <button class="btn btn-sm btn-outline btn-edit-product" data-id="${p.id}" title="Edit Data">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-sm btn-outline btn-add-pm-stock" data-id="${p.id}" title="Tambah Stok +10">
                            <i class="fa-solid fa-square-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-outline text-danger btn-delete-product" data-id="${p.id}" title="Hapus Produk">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Register Product Actions
        tbody.querySelectorAll('.btn-edit-product').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                openProductModal(id);
            };
        });

        tbody.querySelectorAll('.btn-add-pm-stock').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const p = state.products.find(prod => prod.id === id);
                if (p) {
                    p.stock += 10;
                    saveProducts();
                    renderProductsView();
                    showToast(`Stok ${p.name} ditambah menjadi ${p.stock}`, 'success');
                }
            };
        });

        tbody.querySelectorAll('.btn-delete-product').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const p = state.products.find(prod => prod.id === id);
                if (p && confirm(`Apakah Anda yakin ingin menghapus produk "${p.name}"?`)) {
                    state.products = state.products.filter(prod => prod.id !== id);
                    saveProducts();
                    renderProductsView();
                    showToast(`Produk ${p.name} telah dihapus`, 'warning');
                }
            };
        });
    }

    function renderProductCategoryFilter() {
        const select = document.getElementById('pm-category-filter');
        const categories = ['all', ...new Set(state.products.map(p => p.category))];
        
        const currentVal = select.value;
        select.innerHTML = '<option value="all">Semua Kategori</option>';
        categories.filter(c => c !== 'all').forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            select.appendChild(opt);
        });
        select.value = currentVal;
    }

    function openProductModal(productId = null) {
        const modal = document.getElementById('modal-product-form');
        const form = document.getElementById('form-product');
        const title = document.getElementById('product-modal-title');

        form.reset();
        modal.classList.add('active');

        if (productId) {
            title.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Produk`;
            const p = state.products.find(prod => prod.id === productId);
            if (p) {
                document.getElementById('pm-id').value = p.id;
                document.getElementById('pm-name').value = p.name;
                document.getElementById('pm-category').value = p.category;
                document.getElementById('pm-stock').value = p.stock;
                document.getElementById('pm-buy-price').value = p.buyPrice;
                document.getElementById('pm-sell-price').value = p.sellPrice;
                document.getElementById('pm-image').value = p.image;
            }
        } else {
            title.innerHTML = `<i class="fa-solid fa-box"></i> Tambah Produk Baru`;
            document.getElementById('pm-id').value = '';
        }
    }

    function setupProductHandlers() {
        document.getElementById('pm-search').addEventListener('input', renderProductsView);
        document.getElementById('pm-category-filter').addEventListener('change', renderProductsView);

        document.getElementById('btn-open-add-product').addEventListener('click', () => openProductModal());

        document.getElementById('form-product').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('pm-id').value;
            const name = document.getElementById('pm-name').value.trim();
            const category = document.getElementById('pm-category').value.trim();
            const stock = parseInt(document.getElementById('pm-stock').value) || 0;
            const buyPrice = parseFloat(document.getElementById('pm-buy-price').value) || 0;
            const sellPrice = parseFloat(document.getElementById('pm-sell-price').value) || 0;
            let image = document.getElementById('pm-image').value.trim();

            if (!image) {
                image = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
            }

            if (id) {
                // Update Existing
                const p = state.products.find(prod => prod.id === id);
                if (p) {
                    p.name = name;
                    p.category = category;
                    p.stock = stock;
                    p.buyPrice = buyPrice;
                    p.sellPrice = sellPrice;
                    p.image = image;
                    showToast(`Produk ${name} berhasil diperbarui`, 'success');
                }
            } else {
                // Create New
                const newId = 'PROD-' + (100 + state.products.length + 1);
                state.products.push({ id: newId, name, category, buyPrice, sellPrice, stock, image });
                showToast(`Produk ${name} berhasil ditambahkan`, 'success');
            }

            saveProducts();
            document.getElementById('modal-product-form').classList.remove('active');
            renderProductsView();
        });
    }

    // --- APP INITIALIZATION ---
    document.addEventListener('DOMContentLoaded', () => {
        initData();
        startClock();
        setupAuth();
        setupAccountHandlers();
        setupNavigation();
        setupPOSHandlers();
        setupCheckoutHandlers();
        setupReceiptHandlers();
        setupReportHandlers();
        setupHistoryHandlers();
        setupProductHandlers();

        // Pulihkan sesi jika pengguna masih login, jika tidak tampilkan halaman masuk
        const sessionUserId = getStoredSession();
        const savedUser = state.accounts.find(account => account.id === sessionUserId);
        if (savedUser) {
            enterApp(savedUser);
        } else {
            showLoginScreen();
        }
    });

})();
