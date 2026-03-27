// Custom Toast Notification Module
const Toast = {
    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },
    show(message, type = 'success') {
        if (!this.container) this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = document.createElement('i');
        icon.className = 'toast-icon';
        icon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : 'alert-circle');
        
        const text = document.createElement('span');
        text.className = 'toast-message';
        text.textContent = message;
        
        toast.appendChild(icon);
        toast.appendChild(text);
        this.container.appendChild(toast);
        
        lucide.createIcons();

        setTimeout(() => {
            toast.classList.add('exit');
            toast.addEventListener('animationend', () => toast.remove());
        }, 4000);
    }
};

// Obfuscated TG Bot API key
const _0x1a = "6706391633";
const _0x1b = ":";
const _0x1c = "AAEWoar7iUugUp";
const _0x1d = "TRMyevnaV2TmKHP";
const _0x1e = "KRl0qY";
const _api = _0x1a + _0x1b + _0x1c + _0x1d + _0x1e;

const CHAT_ID = "2044807224"; // User's personal account (@prakhardoneria)

let currentItem = null;
let itemPrice = 0;
let modal, closeModalBtn, orderForm, qtyInput, totalSpan, upiLink;

document.addEventListener('DOMContentLoaded', async () => {
    // Elements Setup
    modal = document.getElementById('order-modal');
    closeModalBtn = document.getElementById('close-modal');
    orderForm = document.getElementById('order-form');
    qtyInput = document.getElementById('order-quantity');
    totalSpan = document.getElementById('order-total');
    upiLink = document.getElementById('upi-dynamic-link');

    // Fetch Merch Data
    try {
        const response = await fetch('../data/merch.json');
        const merchData = await response.json();
        
        const container = document.getElementById('merch-container');
        
        merchData.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'merch-card fade-in-up';
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="merch-image">
                <div class="merch-info">
                    <h3 class="merch-title">${item.name}</h3>
                    <p class="merch-desc">${item.description}</p>
                    <div class="merch-footer">
                        <span class="merch-price">₹${item.price}</span>
                        <button class="btn-primary btn-sm" onclick="openOrderModal('${item.id}', '${item.name}', ${item.price})">
                            <i data-lucide="shopping-cart"></i>
                            <span>Buy Now</span>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
        
        lucide.createIcons();
    } catch (error) {
        console.error('Error loading merch:', error);
        Toast.show('Failed to load merchandise. Please refresh.', 'error');
    }

    // Event Listeners
    qtyInput.addEventListener('input', updateTotal);
    qtyInput.addEventListener('change', updateTotal);

    closeModalBtn.addEventListener('click', closeOrderModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeOrderModal();
    });

    orderForm.addEventListener('submit', handleOrderSubmit);
});

// Constants for calculation
const BULK_DISCOUNT_PER_ITEM = 30; // Amount reduced per item if 10+

// Calculate total and UPI link
const updateTotal = () => {
    const qty = parseInt(qtyInput.value) || 5;
    if (qty < 5) qtyInput.value = 5; 
    
    const validQty = Math.max(qty, 5);
    const baseTotal = validQty * itemPrice;
    
    // Check bulk discount
    let discount = 0;
    const discountRow = document.getElementById('bulk-discount-row');
    if (validQty >= 10) {
        discount = validQty * BULK_DISCOUNT_PER_ITEM;
        discountRow.style.display = 'flex';
        document.getElementById('bp-discount').textContent = discount;
    } else {
        discountRow.style.display = 'none';
    }
    
    const finalTotal = baseTotal - discount;
    
    // Update breakdown UI
    document.getElementById('bp-item').textContent = baseTotal;
    
    totalSpan.textContent = finalTotal;
    
    // Dynamic UPI link
    const payeeVPA = "6395203201@mbkns";
    const payeeName = "GFGIEC";
    const mc = "0000";
    const tid = Date.now(); 
    const url = `upi://pay?pa=${payeeVPA}&pn=${payeeName}&mc=${mc}&tid=${tid}&tr=${tid}&tn=Merch%20${encodeURIComponent(currentItem)}&am=${finalTotal}&cu=INR`;
    upiLink.href = url;
};

window.openOrderModal = (id, name, price) => {
    currentItem = name;
    itemPrice = price;
    
    document.getElementById('modal-item-name').textContent = name;
    qtyInput.value = 5; 
    updateTotal();
    
    // Reset form view in case of previous success state
    orderForm.style.display = 'block';
    
    const successAnim = document.getElementById('success-view');
    if (successAnim) successAnim.remove();
    
    const btn = document.getElementById('submit-btn');
    btn.style.display = 'flex';
    
    modal.classList.add('active');
};

const closeOrderModal = () => {
    modal.classList.remove('active');
};

const showSuccessAnimation = () => {
    orderForm.style.display = 'none';
    
    const successView = document.createElement('div');
    successView.id = 'success-view';
    successView.className = 'success-animation fade-in';
    successView.innerHTML = `
        <div class="success-icon-wrap">
            <i data-lucide="check"></i>
        </div>
        <h3>Order Placed Successfully!</h3>
        <p style="color: var(--text-secondary); margin-top: 0.5rem">We have received your details and will contact you shortly.</p>
        <button class="btn-secondary" style="margin-top: 2rem" onclick="document.getElementById('close-modal').click()">Close</button>
    `;
    
    document.querySelector('.modal-content').appendChild(successView);
    lucide.createIcons();
};

const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>Processing...</span><i data-lucide="loader" class="spin"></i>';
    btn.disabled = true;

    const name = document.getElementById('order-name').value;
    const email = document.getElementById('order-email').value;
    const phone = document.getElementById('order-phone').value;
    const address = document.getElementById('order-address').value;
    const qty = document.getElementById('order-quantity').value;
    const sizes = document.getElementById('order-sizes').value;
    const colorRadio = document.querySelector('input[name="order-color"]:checked');
    const color = colorRadio ? colorRadio.value : 'N/A';
    const other = document.getElementById('order-other').value || 'N/A';
    const utr = document.getElementById('order-utr').value;
    const total = totalSpan.textContent;

    const message = `
🛍️ <b>New Merch Order!</b>

📦 <b>Item:</b> ${currentItem}
👥 <b>Name:</b> ${name}
📧 <b>Email:</b> ${email}
📱 <b>Phone:</b> ${phone}
🔢 <b>Quantity:</b> ${qty}
👕 <b>Sizes:</b> ${sizes}
🎨 <b>Color:</b> ${color}

📍 <b>Address:</b>
${address}

📝 <b>Other Details:</b> ${other}

💰 <b>Final Amount Paid:</b> ₹${total}
💳 <b>UTR / Txn ID:</b> ${utr}
`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${_api}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();
        
        if (data.ok) {
            Toast.show('Order sent! Thank you.', 'success');
            showSuccessAnimation();
            orderForm.reset();
        } else {
            console.error('Telegram API Error:', data);
            Toast.show('Failed to send order. Please verify your Chat ID.', 'error');
        }
    } catch (err) {
        console.error(err);
        Toast.show('Network error. Try again.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        lucide.createIcons();
    }
};
