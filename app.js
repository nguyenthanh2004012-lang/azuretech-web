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

    // --- GỌI API AZURE FUNCTIONS CHO PHẦN GỢI Ý AI ---
    const aiProductsContainer = document.getElementById('ai-products');
    const aiLoading = document.getElementById('ai-loading');
    const btnRefreshAi = document.getElementById('refresh-ai');

    window.fetchAIRecommendations = function() {
        if(!aiProductsContainer) return;

        aiProductsContainer.innerHTML = '';
        aiProductsContainer.classList.add('hidden');
        if(aiLoading) aiLoading.classList.remove('hidden');

        fetch('https://api-truong-2026-ddcwf5eadbfnh4a9.southeastasia-01.azurewebsites.net/api/GetAIRecommendations')
            .then(response => response.json())
            .then(data => {
                if(aiLoading) aiLoading.classList.add('hidden');
                aiProductsContainer.classList.remove('hidden');

                const shuffled = [...data].sort(() => 0.5 - Math.random());
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
            })
            .catch(error => {
                console.error('Lỗi khi gọi Azure API:', error);
                if(aiLoading) aiLoading.innerHTML = '<p>Không thể kết nối đến Azure Functions API!</p>';
            });
    }

    if(btnRefreshAi) {
        btnRefreshAi.addEventListener('click', window.fetchAIRecommendations);
        window.fetchAIRecommendations();
    }

    // --- CHECKOUT LOGIC (GỬI ĐƠN HÀNG VỀ TABLE STORAGE) ---
    const btnSubmitOrder = document.getElementById('btn-submit-order');
    if(btnSubmitOrder) {
        btnSubmitOrder.addEventListener('click', () => {
            if(cart.length === 0) {
                alert("Giỏ hàng của bạn đang trống!");
                return;
            }

            const orderData = {
                orderId: "ORD-" + Math.floor(Math.random() * 100000),
                items: cart,
                total: document.getElementById('checkout-final-total') ? document.getElementById('checkout-final-total').innerText : "$0.00",
                timestamp: new Date().toISOString()
            };

            const overlay = document.getElementById('checkout-overlay');
            const loading = document.getElementById('checkout-loading');
            const success = document.getElementById('checkout-success');

            if(overlay) overlay.classList.remove('hidden');
            if(loading) loading.classList.remove('hidden');

            fetch('https://api-truong-2026-ddcwf5eadbfnh4a9.southeastasia-01.azurewebsites.net/api/SubmitOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            })
            .then(response => response.json())
            .then(result => {
                setTimeout(() => {
                    if(loading) loading.classList.add('hidden');
                    if(success) success.classList.remove('hidden');
                    cart = [];
                    saveCart();
                    updateCartUI();
                }, 1500);
            })
            .catch(error => {
                console.error('Lỗi lưu đơn hàng vào Azure:', error);
                setTimeout(() => {
                    if(loading) loading.classList.add('hidden');
                    if(success) success.classList.remove('hidden');
                    cart = [];
                    saveCart();
                    updateCartUI();
                }, 1500);
            });
        });
    }
});
