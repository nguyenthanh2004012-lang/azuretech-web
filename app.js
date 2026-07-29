document.addEventListener('DOMContentLoaded', () => {
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

    window.addEventListener('scroll', () => {
        if(window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

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
});// === CHỨC NĂNG DỊCH THUẬT AZURE ===
window.addEventListener('DOMContentLoaded', () => {
    const btnTranslate = document.getElementById('ai-translate-btn');
    const inputTranslate = document.getElementById('ai-translate-input');
    const resultTranslate = document.getElementById('ai-translate-result');

    if (btnTranslate && inputTranslate && resultTranslate) {
        btnTranslate.addEventListener('click', () => {
            const textToTranslate = inputTranslate.value.trim();
            if (!textToTranslate) {
                alert("Bạn chưa nhập chữ!");
                return;
            }

            resultTranslate.innerText = "Đang nhờ Azure dịch...";

            fetch('https://api-truong-2026-ddcwf5eadbfnh4a9.southeastasia-01.azurewebsites.net/api/TranslateText', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToTranslate,
                    to: "vi" // Dịch sang tiếng Việt
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resultTranslate.innerText = "Kết quả: " + data.translated;
                } else {
                    resultTranslate.innerText = "Lỗi: " + data.message;
                }
            })
            .catch(error => {
                console.error("Lỗi gọi API Dịch:", error);
                resultTranslate.innerText = "Lỗi kết nối đến Azure!";
            });
        });
    }
});
// === CHỨC NĂNG TEXT TO SPEECH (ĐỌC VĂN BẢN) ===
const btnTts = document.getElementById('ai-tts-btn');
const inputTts = document.getElementById('ai-tts-input');
const statusTts = document.getElementById('ai-tts-status');
const audioTts = document.getElementById('ai-tts-audio');

if (btnTts && inputTts && statusTts && audioTts) {
    btnTts.addEventListener('click', () => {
        const textToSpeak = inputTts.value.trim();
        if (!textToSpeak) {
            alert("Bạn chưa nhập chữ!");
            return;
        }

        statusTts.innerText = "Đang nhờ Azure tạo giọng nói...";
        btnTts.disabled = true;

        fetch('https://api-truong-2026-ddcwf5eadbfnh4a9.southeastasia-01.azurewebsites.net/api/TextToSpeech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToSpeak })
        })
        .then(response => response.json())
        .then(data => {
            btnTts.disabled = false;
            if (data.success && data.audioBase64) {
                statusTts.innerText = "Đang phát âm thanh 🔊...";
                
                // Chuyển đổi mã base64 thành Blob an toàn để trình duyệt không bị lỗi NotSupportedError
                const binaryString = atob(data.audioBase64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'audio/mp3' });
                
                // Gắn Blob URL vào thẻ phát nhạc
                audioTts.src = URL.createObjectURL(blob);
                audioTts.play().catch(e => {
                    console.error("Lỗi phát nhạc:", e);
                    statusTts.innerText = "Trình duyệt chặn tự động phát âm thanh!";
                });
                
                audioTts.onended = () => {
                    statusTts.innerText = "Đã phát xong!";
                };
            } else {
                statusTts.innerText = "Lỗi: " + (data.message || "Không nhận được dữ liệu âm thanh");
            }
        })
        .catch(error => {
            btnTts.disabled = false;
            console.error("Lỗi API Giọng nói:", error);
            statusTts.innerText = "Lỗi kết nối đến Azure!";
        });
    });
}
