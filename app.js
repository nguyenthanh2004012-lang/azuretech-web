document.addEventListener('DOMContentLoaded', () => {
    // === CHỨC NĂNG GIỎ HÀNG VÀ GIAO DIỆN CƠ BẢN ===
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
});

// === CHỨC NĂNG DỊCH THUẬT AZURE ===
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
                    to: "vi"
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
window.addEventListener('DOMContentLoaded', () => {
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
                    
                    audioTts.src = "data:audio/mp3;base64," + data.audioBase64;
                    audioTts.load();
                    
                    audioTts.play().catch(e => {
                        console.error("Lỗi phát nhạc:", e);
                        statusTts.innerText = "Trình duyệt chặn tự động phát!";
                    });
                    
                    audioTts.onended = () => {
                        statusTts.innerText = "Đã phát xong!";
                    };
                } else {
                    statusTts.innerText = "Lỗi: " + (data.message || "Không có dữ liệu âm thanh");
                }
            })
            .catch(error => {
                btnTts.disabled = false;
                console.error("Lỗi API Giọng nói:", error);
                statusTts.innerText = "Lỗi kết nối đến Azure!";
            });
        });
    }
});

// === CHỨC NĂNG COMPUTER VISION (PHÂN TÍCH ẢNH) - BẢN HIỂN THỊ ĐẸP ===
window.addEventListener('DOMContentLoaded', () => {
    const inputVision = document.getElementById('ai-vision-input');
    const btnVision = document.getElementById('ai-vision-btn');
    const previewVision = document.getElementById('ai-vision-preview');
    const statusVision = document.getElementById('ai-vision-status');
    const resultVision = document.getElementById('ai-vision-result');

    if (inputVision && btnVision) {
        inputVision.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewVision.src = e.target.result;
                    previewVision.style.display = 'inline-block';
                    resultVision.style.display = 'none';
                    statusVision.innerText = "";
                }
                reader.readAsDataURL(file);
            }
        });

        btnVision.addEventListener('click', () => {
            const file = inputVision.files[0];
            if (!file) {
                alert("Bạn chưa chọn ảnh nào!");
                return;
            }

            statusVision.innerText = "Đang nhờ Azure phân tích ảnh... ⏳";
            btnVision.disabled = true;

            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Image = e.target.result;

                fetch('https://api-truong-2026-ddcwf5eadbfnh4a9.southeastasia-01.azurewebsites.net/api/AnalyzeImage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64Image })
                })
                .then(res => res.json())
                .then(data => {
                    btnVision.disabled = false;
                    if (data.success) {
                        const visionData = data.data;
                        
                        if (visionData.error) {
                            statusVision.innerText = "Azure từ chối phân tích! ❌";
                            resultVision.style.display = 'block';
                            resultVision.innerHTML = `<strong style="color:red;">Lỗi từ Azure:</strong> <span style="color:red;">${visionData.error.message || JSON.stringify(visionData.error)}</span>`;
                            return;
                        }

                        statusVision.innerText = "Phân tích thành công! ✅";
                        
                        // Lọc lấy mô tả chính xác nhất từ Azure
                        const caption = visionData.description && visionData.description.captions.length > 0 
                                        ? visionData.description.captions[0].text 
                                        : "Không tìm thấy mô tả chi tiết.";
                        
                        // Lọc lấy danh sách từ khóa (tags)
                        const tags = visionData.tags ? visionData.tags.map(t => t.name).join(", ") : "Không có từ khóa.";

                        // Hiển thị ra giao diện người dùng
                        resultVision.style.display = 'block';
                        resultVision.innerHTML = `
                            <strong style="color:#007bff;">Mô tả (AI phân tích):</strong> ${caption} <br><br>
                            <strong style="color:#28a745;">Từ khóa liên quan:</strong> ${tags}
                        `;
                    } else {
                        statusVision.innerText = "Lỗi: " + data.message;
                    }
                })
                .catch(error => {
                    btnVision.disabled = false;
                    console.error("Lỗi:", error);
                    statusVision.innerText = "Lỗi kết nối đến Server!";
                });
            };
            reader.readAsDataURL(file);
        });
    }
});

// === CHỨC NĂNG FACE API (NHẬN DIỆN KHUÔN MẶT) ===
window.addEventListener('DOMContentLoaded', () => {
    const inputFace = document.getElementById('ai-face-input');
    const btnFace = document.getElementById('ai-face-btn');
    const previewFace = document.getElementById('ai-face-preview');
    const statusFace = document.getElementById('ai-face-status');
    const resultFace = document.getElementById('ai-face-result');

    if (inputFace && btnFace) {
        inputFace.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewFace.src = e.target.result;
                    previewFace.style.display = 'inline-block';
                    resultFace.style.display = 'none';
                    statusFace.innerText = "";
                }
                reader.readAsDataURL(file);
            }
        });

        btnFace.addEventListener('click', () => {
            const file = inputFace.files[0];
            if (!file) {
                alert("Bạn chưa chọn ảnh nào!");
                return;
            }

            statusFace.innerText = "Đang nhờ Azure quét khuôn mặt... ⏳";
            btnFace.disabled = true;

            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Image = e.target.result;

                fetch('https://api-truong-2026-ddcwf5eadbfnh4a9.southeastasia-01.azurewebsites.net/api/AnalyzeFace', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64Image })
                })
                .then(res => res.json())
                .then(data => {
                    btnFace.disabled = false;
                    if (data.success) {
                        const faceData = data.data;
                        
                        if (faceData.error) {
                            statusFace.innerText = "Azure từ chối phân tích! ❌";
                            resultFace.style.display = 'block';
                            resultFace.innerHTML = `<strong style="color:red;">Lỗi từ Azure:</strong> <span style="color:red;">${faceData.error.message || JSON.stringify(faceData.error)}</span>`;
                            return;
                        }

                        if (!faceData || faceData.length === 0) {
                            statusFace.innerText = "Không tìm thấy khuôn mặt nào trong ảnh! 🕵️‍♂️";
                            return;
                        }

                        statusFace.innerText = `Phân tích thành công! Phát hiện ${faceData.length} khuôn mặt ✅`;
                        
                        let htmlResult = "";
                        faceData.forEach((face, index) => {
                            const rect = face.faceRectangle;
                            htmlResult += `
                                <div style="margin-bottom: 10px; padding: 10px; border-bottom: 1px solid #ccc;">
                                    <strong style="color: #6f42c1;">Khuôn mặt ${index + 1}</strong><br>
                                    - Trạng thái: Đã định vị thành công ✅<br>
                                    - Khung tọa độ: Rộng ${rect.width}px, Cao ${rect.height}px
                                </div>
                            `;
                        });

                        resultFace.style.display = 'block';
                        resultFace.innerHTML = htmlResult;
                    } else {
                        statusFace.innerText = "Lỗi: " + data.message;
                    }
                })
                .catch(error => {
                    btnFace.disabled = false;
                    console.error("Lỗi:", error);
                    statusFace.innerText = "Lỗi kết nối đến Server!";
                });
            };
            reader.readAsDataURL(file);
        });
    }
});
// === CHỨC NĂNG AZURE AI LANGUAGE (PHÂN TÍCH CẢM XÚC) ===
window.addEventListener('DOMContentLoaded', () => {
    const btnLang = document.getElementById('ai-lang-btn');
    const inputLang = document.getElementById('ai-lang-input');
    const statusLang = document.getElementById('ai-lang-status');
    const resultLang = document.getElementById('ai-lang-result');

    if (btnLang && inputLang && statusLang && resultLang) {
        btnLang.addEventListener('click', () => {
            const textToAnalyze = inputLang.value.trim();
            if (!textToAnalyze) {
                alert("Bạn chưa nhập chữ!");
                return;
            }

            statusLang.innerText = "Đang nhờ Azure bắt mạch cảm xúc... ⏳";
            btnLang.disabled = true;
            resultLang.style.display = 'none';

            fetch('https://api-truong-2026-ddcwf5eadbfnh4a9.southeastasia-01.azurewebsites.net/api/AnalyzeLanguage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToAnalyze })
            })
            .then(response => response.json())
            .then(data => {
                btnLang.disabled = false;
                if (data.success) {
                    const langData = data.data;
                    
                    if (langData.error || (langData.results && langData.results.errors && langData.results.errors.length > 0)) {
                        statusLang.innerText = "Azure từ chối phân tích! ❌";
                        return;
                    }

                    statusLang.innerText = "Phân tích xong! ✅";
                    const docResult = langData.results.documents[0];
                    
                    let sentimentVi = "";
                    let icon = "";
                    if (docResult.sentiment === "positive") { sentimentVi = "Tích cực"; icon = "🥰"; }
                    else if (docResult.sentiment === "negative") { sentimentVi = "Tiêu cực"; icon = "😡"; }
                    else if (docResult.sentiment === "neutral") { sentimentVi = "Bình thường"; icon = "😐"; }
                    else { sentimentVi = "Trái chiều (Vừa khen vừa chê)"; icon = "🤔"; }

                    resultLang.style.display = 'block';
                    resultLang.innerHTML = `
                        <strong style="color:#17a2b8;">Kết quả tổng quan:</strong> ${sentimentVi} ${icon}<br><br>
                        <strong>Tỉ lệ AI đoán:</strong><br>
                        - Tích cực: ${Math.round(docResult.confidenceScores.positive * 100)}%<br>
                        - Trung tính: ${Math.round(docResult.confidenceScores.neutral * 100)}%<br>
                        - Tiêu cực: ${Math.round(docResult.confidenceScores.negative * 100)}%
                    `;
                } else {
                    statusLang.innerText = "Lỗi: " + data.message;
                }
            })
            .catch(error => {
                btnLang.disabled = false;
                console.error("Lỗi API Language:", error);
                statusLang.innerText = "Lỗi kết nối đến Server!";
            });
        });
    }
});
// === CHỨC NĂNG AZURE AI CONTENT SAFETY (KIỂM DUYỆT NỘI DUNG) ===
window.addEventListener('DOMContentLoaded', () => {
    const btnSafety = document.getElementById('ai-safety-btn');
    const inputSafety = document.getElementById('ai-safety-input');
    const statusSafety = document.getElementById('ai-safety-status');
    const resultSafety = document.getElementById('ai-safety-result');

    if (btnSafety && inputSafety && statusSafety && resultSafety) {
        btnSafety.addEventListener('click', () => {
            const textToCheck = inputSafety.value.trim();
            if (!textToCheck) {
                alert("Bạn chưa nhập chữ!");
                return;
            }

            statusSafety.innerText = "Đang nhờ Azure kiểm duyệt nội dung... ⏳";
            btnSafety.disabled = true;
            resultSafety.style.display = 'none';

            fetch('https://api-truong-2026-ddcwf5eadbfnh4a9.southeastasia-01.azurewebsites.net/api/CheckContentSafety', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToCheck })
            })
            .then(response => response.json())
            .then(data => {
                btnSafety.disabled = false;
                if (data.success) {
                    const safetyData = data.data;
                    
                    if (safetyData.error) {
                        statusSafety.innerText = "Azure từ chối kiểm duyệt! ❌";
                        return;
                    }

                    statusSafety.innerText = "Kiểm duyệt xong! ✅";
                    
                    // Lấy điểm số mức độ nguy hại (Hate, SelfHarm, Sexual, Violence từ 0 đến 6)
                    const categories = safetyData.categoriesAnalysis || [];
                    let htmlResult = "<strong style='color:#d39e00;'>Mức độ độc hại (Điểm càng cao càng nguy hiểm, thang từ 0-6):</strong><br><br>";
                    
                    if (categories.length === 0) {
                        htmlResult += "Nội dung hoàn toàn trong sạch, an toàn tuyệt đối! 🟢";
                    } else {
                        categories.forEach(cat => {
                            let severityName = "";
                            if (cat.category === "Hate") severityName = "Ngôn từ thù ghét (Hate Speech)";
                            else if (cat.category === "SelfHarm") severityName = "Tự hại (Self Harm)";
                            else if (cat.category === "Sexual") severityName = "Nội dung nhạy cảm (Sexual)";
                            else if (cat.category === "Violence") severityName = "Bạo lực (Violence)";
                            else severityName = cat.category;

                            let color = cat.severity > 0 ? "red" : "green";
                            htmlResult += `- ${severityName}: <span style="color:${color}; font-weight:bold;">Mức độ ${cat.severity}</span><br>`;
                        });
                    }

                    resultSafety.style.display = 'block';
                    resultSafety.innerHTML = htmlResult;
                } else {
                    statusSafety.innerText = "Lỗi: " + data.message;
                }
            })
            .catch(error => {
                btnSafety.disabled = false;
                console.error("Lỗi API Content Safety:", error);
                statusSafety.innerText = "Lỗi kết nối đến Server!";
            });
        });
    }
});
// === CHỨC NĂNG SIGNALR NHẬN POPUP (CHUẨN EVENT NAME) ===
window.addEventListener('DOMContentLoaded', () => {
    if (typeof signalR !== 'undefined') {
        const connection = new signalR.HubConnectionBuilder()
            // Trỏ đúng tới route /api/signalr để nó tự gọi /negotiate của ông
            .withUrl("https://api-chatbot-lam-2026-cqa6fdcdg5f9b0h2.southeastasia-01.azurewebsites.net/api/signalr") 
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // Lắng nghe đúng tên sự kiện receiveNotification từ code Backend
        connection.on("receiveNotification", function (message) { 
            console.log("📢 Nhận được tín hiệu từ Azure:", message);
            const toast = document.getElementById('toast');
            if (toast) {
                toast.innerText = message;
                toast.classList.add('show');
                toast.style.background = "#28a745"; // Nền xanh lá báo thành công
                setTimeout(() => { toast.classList.remove('show'); }, 5000);
            } else {
                alert(message);
            }
        });

        connection.start().then(function () {
            console.log("✅ Đã kết nối SignalR thành công! Đang đợi đơn hàng...");
        }).catch(function (err) {
            console.error("❌ Lỗi kết nối SignalR:", err.toString());
        });
    } else {
        console.warn("⚠️ Báo Frontend: Chưa chèn link thư viện SignalR vào file index.html kìa!");
    }
});
