document.addEventListener('DOMContentLoaded', () => {
    // --- LƯU TRỮ VÀ GIAO DIỆN GIỎ HÀNG ---
    let cart = JSON.parse(localStorage.getItem('azureTechCart')) || [];
    
    const cartToggle = document.getElementById('cart-toggle');
    const closeCart = document.getElementById('close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const toast = document.getElementById('toast');
    const navbar = document.querySelector('.navbar');

    // SCROLL NAVBAR EFFECT
    window.addEventListener('scroll', () => {
        if(window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // CÁC HIỆU ỨNG REVEAL KHI CUỘN CHUỘT
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    // Gắn class reveal cho các thành phần để chạy hiệu ứng fade-up
    document.querySelectorAll('.product-card, .section-header, .hero-content').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });


    function saveCart() {
        localStorage.setItem('azureTechCart', JSON.stringify(cart));
    }

    function toggleCart() {
        if(cartSidebar && cartOverlay) {
            cartSidebar.classList.toggle('active');
            cartOverlay.classList.toggle('active');
        }
    }

    if(cartToggle) cartToggle.addEventListener('click', toggleCart);
    if(closeCart) closeCart.addEventListener('click', toggleCart);
    if(cartOverlay) cartOverlay.addEventListener('click', toggleCart);

    function updateCartUI() {
        if(cartCount) cartCount.innerText = cart.length;
        
        let total = 0;
        let html = '';

        if (cart.length === 0) {
            if(cartItemsContainer) cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Giỏ hàng đang trống.</p>';
            if(cartTotal) cartTotal.innerText = '$0.00';
            
            // Trang checkout
            const checkoutSubtotal = document.getElementById('checkout-subtotal');
            const checkoutFinal = document.getElementById('checkout-final-total');
            const checkoutItems = document.getElementById('checkout-items');
            if(checkoutSubtotal) checkoutSubtotal.innerText = '$0.00';
            if(checkoutFinal) checkoutFinal.innerText = '$0.00';
            if(checkoutItems) checkoutItems.innerHTML = '<p>Không có sản phẩm nào.</p>';
            return;
        }

        cart.forEach((item, index) => {
            total += parseFloat(item.price);
            html += `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <span class="price">$${item.price}</span>
                    </div>
                    <button class="cart-remove" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        });
        
        if(cartItemsContainer) cartItemsContainer.innerHTML = html;
        if(cartTotal) cartTotal.innerText = '$' + total.toFixed(2);

        // Nút xóa trong giỏ hàng
        document.querySelectorAll('.cart-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('.cart-remove').getAttribute('data-index');
                cart.splice(index, 1);
                saveCart();
                updateCartUI();
                
                if(typeof fetchAIRecommendations === 'function') {
                    fetchAIRecommendations();
                }
            });
        });

        // Checkout Sync
        const checkoutItems = document.getElementById('checkout-items');
        if(checkoutItems) {
            checkoutItems.innerHTML = html; 
            document.getElementById('checkout-subtotal').innerText = '$' + total.toFixed(2);
            document.getElementById('checkout-final-total').innerText = '$' + total.toFixed(2);
        }
    }

    function showToast(msg) {
        if(!toast) return;
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Gắn sự kiện mua hàng
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-add-cart');
            const name = button.getAttribute('data-name');
            const price = button.getAttribute('data-price');
            const img = button.getAttribute('data-img');

            cart.push({ name, price, img });
            saveCart();
            updateCartUI();
            showToast(`Thêm thành công: ${name}`);

            if(typeof fetchAIRecommendations === 'function') {
                fetchAIRecommendations();
            }
        });
    });

    updateCartUI();

    // --- MÔ PHỎNG AZURE MACHINE LEARNING GỢI Ý (Trang chủ) ---
    const aiProductsContainer = document.getElementById('ai-products');
    const aiLoading = document.getElementById('ai-loading');
    const btnRefreshAi = document.getElementById('refresh-ai');

    const dbRecommend = [
        { name: "Ốp lưng iPhone 15 Pro", price: "29.99", img: "img/iphone.svg", cat: "Phụ kiện" },
        { name: "Chuột Magic Mouse", price: "79.00", img: "img/mouse.svg", cat: "Phụ kiện" },
        { name: "Bàn phím cơ Keychron", price: "99.00", img: "img/keyboard.svg", cat: "Phụ kiện" },
        { name: "Màn hình Dell UltraSharp", price: "599.00", img: "img/dell.svg", cat: "Màn hình" },
        { name: "AirPods Pro", price: "249.00", img: "img/headphones.svg", cat: "Phụ kiện" }
    ];

    window.fetchAIRecommendations = function() {
        if(!aiProductsContainer) return;

        aiProductsContainer.innerHTML = '';
        aiProductsContainer.classList.add('hidden');
        aiLoading.classList.remove('hidden');

        // Fake delay để giống gọi API
        setTimeout(() => {
            aiLoading.classList.add('hidden');
            aiProductsContainer.classList.remove('hidden');

            const shuffled = [...dbRecommend].sort(() => 0.5 - Math.random());
            let html = '';
            shuffled.slice(0, 3).forEach(item => {
                html += `
                    <div class="product-card reveal active" style="background: rgba(0,0,0,0.2);">
                        <div class="product-img">
                            <img src="${item.img}" alt="${item.name}" style="object-fit:contain; padding:10px;">
                        </div>
                        <div class="product-info">
                            <p class="category">${item.cat}</p>
                            <h3>${item.name}</h3>
                            <div class="price-row">
                                <span class="price">$${item.price}</span>
                                <button class="btn-add-cart" data-name="${item.name}" data-price="${item.price}" data-img="${item.img}"><i class="fa-solid fa-plus"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            });
            aiProductsContainer.innerHTML = html;

            // Chạy lại logic mua hàng cho gợi ý mới
            aiProductsContainer.querySelectorAll('.btn-add-cart').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const button = e.target.closest('.btn-add-cart');
                    cart.push({
                        name: button.getAttribute('data-name'),
                        price: button.getAttribute('data-price'),
                        img: button.getAttribute('data-img')
                    });
                    saveCart();
                    updateCartUI();
                    showToast(`Thêm thành công: ${button.getAttribute('data-name')}`);
                });
            });
        }, 1200);
    }

    if(btnRefreshAi) {
        btnRefreshAi.addEventListener('click', window.fetchAIRecommendations);
        window.fetchAIRecommendations();
    }

    // --- CHECKOUT LOGIC (Giả lập Azure SQL & Key Vault) ---
    const btnSubmitOrder = document.getElementById('btn-submit-order');
    if(btnSubmitOrder) {
        btnSubmitOrder.addEventListener('click', () => {
            if(cart.length === 0) {
                alert("Giỏ hàng của bạn đang trống!");
                return;
            }

            document.getElementById('checkout-overlay').classList.remove('hidden');
            
            // Xử lý loading 2.5s
            setTimeout(() => {
                document.getElementById('checkout-loading').classList.add('hidden');
                document.getElementById('checkout-success').classList.remove('hidden');
                
                // Xóa giỏ hàng sau khi thanh toán
                cart = [];
                saveCart();
                updateCartUI();
            }, 2500);
        });
    }
});
