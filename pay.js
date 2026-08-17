const BANK = { name: '토스뱅크', account: '1002-7227-6855', copyAccount: '100272276855' };

// 상품명과 가격은 이 배열에서 수정합니다. 수량은 새로고침마다 항상 0으로 초기화됩니다.
const products = [
  { id: 'moray-wallet', name: 'MORAY MAGSAFE WALLET', price: 20000, discountRate: 0 },
  { id: 'shark-lighter', name: 'SHARK LIGHTER CASE', price: 15000, discountRate: 0 },
  { id: 'hammerhead-airpods', name: 'HAMMERHEAD AIRPODS CASE', price: 18000, discountRate: 0 },
  { id: 'eclipse-case', name: 'ECLIPSE CASE', price: 15000, discountRate: 0 },
  { id: 'keyring', name: 'KEYRING', price: 4000, discountRate: 0 },
  { id: 'postcard', name: 'POSTCARD', price: 4000, discountRate: 0 },
  { id: 'poster', name: 'POSTER', price: 4000, discountRate: 0 },
  { id: 'calendar', name: 'CALENDAR', price: 9000, discountRate: 0 },
  { id: 'sheet-sticker', name: 'SHEET STICKER', price: 4000, discountRate: 0 },
  { id: 'jibbitz', name: 'JIBBITZ', price: 9000, discountRate: 0 },
];
let adminDraftProducts = [];
let adminSessionToken = '';

const transferApps = [
  { name: '토스 앱 열기', action: 'toss' },
  { name: '카카오페이', action: 'kakao-pay' },
  { name: '직접 열기', action: 'copy-account' },
];
const TOSS_DEEP_LINK = 'supertoss://toss/pay';
const TOSS_ANDROID_INTENT = 'intent://toss/pay#Intent;scheme=supertoss;package=viva.republica.toss;end';
const quantities = Object.fromEntries(products.map(({ id }) => [id, 0]));
const currency = new Intl.NumberFormat('ko-KR');
const productList = document.querySelector('#product-list');
const totalPrice = document.querySelector('#total-price');
const summary = document.querySelector('#selection-summary');
const discountSummary = document.querySelector('#discount-summary');
const discountRate = document.querySelector('#discount-rate');
const discountPrice = document.querySelector('#discount-price');
const status = document.querySelector('#payment-status');
const copyAccountButton = document.querySelector('#copy-account');
const copyTotalButton = document.querySelector('#copy-total');
const transferButton = document.querySelector('#open-transfer');
const transferDialog = document.querySelector('#transfer-dialog');
const transferOptions = document.querySelector('#transfer-options');
const transferHelp = document.querySelector('#transfer-help');
const adminDialog = document.querySelector('#admin-dialog');
const adminAuth = document.querySelector('#admin-auth');
const adminCode = document.querySelector('#admin-code');
const adminAuthStatus = document.querySelector('#admin-auth-status');
const adminSettings = document.querySelector('#admin-settings');
const adminProductPrices = document.querySelector('#admin-product-prices');
const adminSettingsStatus = document.querySelector('#admin-settings-status');
const selectionAnnouncement = document.querySelector('#selection-announcement');
const undoResetButton = document.querySelector('#undo-reset');
const adminUndoDeleteButton = document.querySelector('#admin-undo-delete');
const paymentDock = document.querySelector('.payment-dock');
let resetSnapshot = null;
let resetUndoTimer = 0;
let deletedDraftProduct = null;

const formatPrice = (price) => `₩${currency.format(price)}`;
const getDiscountRate = (product) => Math.min(100, Math.max(0, Number(product.discountRate) || 0));
const getSubtotal = () => products.reduce((sum, product) => sum + product.price * quantities[product.id], 0);
const getDiscount = () => products.reduce((sum, product) => sum + Math.round(product.price * quantities[product.id] * (getDiscountRate(product) / 100)), 0);
const getTotal = () => {
  const subtotal = getSubtotal();
  return subtotal - getDiscount();
};

function makeButton(label, dataset, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  Object.entries(dataset).forEach(([key, value]) => { button.dataset[key] = value; });
  button.disabled = disabled;
  return button;
}

function renderProducts() {
  productList.replaceChildren(...products.map((product) => {
    const quantity = quantities[product.id];
    const discountRateValue = getDiscountRate(product);
    const row = document.createElement('article');
    row.className = `product-row${quantity ? ' is-selected' : ''}`;
    const details = document.createElement('div');
    const title = document.createElement('h3');
    title.className = 'product-name';
    title.textContent = product.name;
    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = discountRateValue
      ? `${formatPrice(product.price)} → ${formatPrice(Math.round(product.price * (1 - discountRateValue / 100)))}`
      : formatPrice(product.price);
    if (discountRateValue) {
      const discountLabel = document.createElement('b');
      discountLabel.textContent = `FAIR ${discountRateValue}% OFF`;
      price.append(' ', discountLabel);
    }
    details.append(title, price);
    const control = document.createElement('div');
    control.className = 'quantity-control';
    control.setAttribute('aria-label', `${product.name} 수량`);
    const decrease = makeButton('−', { action: 'decrease', id: product.id }, quantity === 0);
    decrease.setAttribute('aria-label', `${product.name} 수량 감소`);
    const value = document.createElement('output');
    value.className = 'quantity-value';
    value.setAttribute('aria-label', `${product.name} 선택 수량`);
    value.textContent = String(quantity);
    const increase = makeButton('+', { action: 'increase', id: product.id });
    increase.setAttribute('aria-label', `${product.name} 수량 증가`);
    control.append(decrease, value, increase);
    row.append(details, control);
    return row;
  }));
}

function renderPayment() {
  const selected = products.filter((product) => quantities[product.id] > 0);
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = subtotal - discount;
  totalPrice.textContent = formatPrice(total);
  discountSummary.hidden = discount === 0;
  discountRate.textContent = 'ITEM';
  discountPrice.textContent = `-${formatPrice(discount)}`;
  summary.replaceChildren();
  if (!selected.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-summary';
    empty.textContent = '선택한 상품이 없습니다.';
    summary.append(empty);
  } else {
    selected.forEach((product) => {
      const item = document.createElement('p');
      item.className = 'summary-item';
      const name = document.createElement('span');
      name.textContent = `${product.name} × ${quantities[product.id]}`;
      const price = document.createElement('span');
      const lineSubtotal = product.price * quantities[product.id];
      const lineTotal = lineSubtotal - Math.round(lineSubtotal * (getDiscountRate(product) / 100));
      price.textContent = formatPrice(lineTotal);
      item.append(name, price);
      summary.append(item);
    });
  }
  [copyTotalButton, transferButton].forEach((button) => { button.disabled = total === 0; });
}

function syncDockOffset() {
  const height = Math.ceil(paymentDock.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--payment-dock-height', `${height}px`);
}

function update() {
  renderProducts();
  renderPayment();
  requestAnimationFrame(syncDockOffset);
}

function applyProducts(nextProducts) {
  products.splice(0, products.length, ...nextProducts.map((product) => ({
    id: product.id,
    name: product.name.trim(),
    price: Math.round(Number(product.price)),
    discountRate: Math.round(getDiscountRate(product)),
  })));
  Object.keys(quantities).forEach((id) => { if (!products.some((product) => product.id === id)) delete quantities[id]; });
  products.forEach((product) => { if (!(product.id in quantities)) quantities[product.id] = 0; });
  update();
}

async function loadSavedProducts() {
  try {
    const response = await fetch('/api/products', { cache: 'no-store' });
    const result = await response.json();
    if (response.ok && Array.isArray(result.products)) applyProducts(result.products);
  } catch {
    // file:// preview keeps the bundled defaults, while the deployed page loads shared settings.
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.append(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('copy failed');
}

function flashButton(button, text) {
  const original = button.dataset.original || button.textContent;
  button.dataset.original = original;
  button.textContent = text;
  window.setTimeout(() => { button.textContent = original; }, 1500);
}

productList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;
  const { id, action } = button.dataset;
  quantities[id] = Math.max(0, quantities[id] + (action === 'increase' ? 1 : -1));
  status.textContent = '';
  const product = products.find((item) => item.id === id);
  selectionAnnouncement.textContent = `${product.name} 수량 ${quantities[id]}개`;
  update();
});

document.querySelector('#reset-cart').addEventListener('click', () => {
  if (!products.some((product) => quantities[product.id] > 0)) return;
  resetSnapshot = { ...quantities };
  products.forEach((product) => { quantities[product.id] = 0; });
  status.textContent = '선택을 초기화했습니다.';
  selectionAnnouncement.textContent = '모든 상품 선택을 초기화했습니다.';
  undoResetButton.hidden = false;
  window.clearTimeout(resetUndoTimer);
  resetUndoTimer = window.setTimeout(() => {
    resetSnapshot = null;
    undoResetButton.hidden = true;
  }, 5000);
  update();
});

undoResetButton.addEventListener('click', () => {
  if (!resetSnapshot) return;
  products.forEach((product) => { quantities[product.id] = resetSnapshot[product.id] || 0; });
  resetSnapshot = null;
  window.clearTimeout(resetUndoTimer);
  undoResetButton.hidden = true;
  status.textContent = '초기화 전 선택을 복원했습니다.';
  selectionAnnouncement.textContent = '초기화 전 상품 선택을 복원했습니다.';
  update();
});

copyAccountButton.addEventListener('click', async () => {
  try {
    await copyText(BANK.copyAccount);
    flashButton(copyAccountButton, '복사 완료');
    status.textContent = '계좌번호를 복사했습니다.';
  } catch { status.textContent = '복사하지 못했습니다. 계좌번호를 직접 확인해 주세요.'; }
});

copyTotalButton.addEventListener('click', async () => {
  const total = getTotal();
  try {
    await copyText(String(total));
    flashButton(copyTotalButton, `${currency.format(total)}원 복사 완료`);
    status.textContent = '결제금액을 복사했습니다.';
  } catch { status.textContent = '복사하지 못했습니다. 결제금액을 직접 확인해 주세요.'; }
});

function openTossApp() {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) {
    transferHelp.textContent = '휴대폰에서 토스 앱 열기를 선택해 주세요. 데스크톱에서는 계좌번호와 금액을 복사할 수 있습니다.';
    return;
  }

  const target = /Android/i.test(navigator.userAgent) ? TOSS_ANDROID_INTENT : TOSS_DEEP_LINK;
  let leftPage = false;
  const handleVisibility = () => { leftPage = document.visibilityState === 'hidden'; };
  document.addEventListener('visibilitychange', handleVisibility, { once: true });
  transferHelp.textContent = '토스 앱을 열고 있습니다.';

  window.setTimeout(() => {
    if (!leftPage && document.visibilityState === 'visible') {
      transferHelp.textContent = '토스 앱을 열지 못했습니다. 앱이 설치되어 있는지 확인하거나 계좌번호와 금액을 복사해 송금해 주세요.';
    }
  }, 1500);

  window.location.href = target;
}

transferApps.forEach((app) => {
  const option = document.createElement('button');
  option.className = `transfer-option${app.action === 'toss' ? ' transfer-option-direct' : ''}`;
  option.type = 'button';
  option.textContent = app.action === 'toss' ? `${app.name} ↗` : app.name;
  option.setAttribute('aria-label', app.action === 'toss' ? '토스 앱 열기' : app.action === 'copy-account' ? '계좌번호를 복사하고 직접 송금 앱 열기 안내 보기' : '카카오페이 송금 안내 보기');
  option.addEventListener('click', async () => {
    if (app.action === 'toss') {
      openTossApp();
      return;
    }
    if (app.action === 'copy-account') {
      try {
        await copyText(BANK.copyAccount);
        transferHelp.textContent = '계좌번호를 복사했습니다. 사용하는 송금 앱을 열어 붙여넣어 주세요.';
      } catch {
        transferHelp.textContent = '계좌번호를 복사하지 못했습니다. 화면의 계좌번호를 직접 확인해 주세요.';
      }
      return;
    }
    transferHelp.textContent = '카카오페이에서는 계좌번호와 결제금액을 복사한 뒤 송금 화면에 붙여넣어 주세요.';
  });
  transferOptions.append(option);
});

transferButton.addEventListener('click', () => {
  transferHelp.textContent = '';
  openTossApp();
});
document.querySelector('#close-transfer').addEventListener('click', () => transferDialog.close());
transferDialog.addEventListener('click', (event) => { if (event.target === transferDialog) transferDialog.close(); });
transferDialog.addEventListener('close', () => transferButton.focus());

function renderAdminSettings() {
  adminProductPrices.replaceChildren(...adminDraftProducts.map((product) => {
    const field = document.createElement('div');
    field.className = 'admin-product-field';
    const name = document.createElement('input');
    name.type = 'text';
    name.value = product.name;
    name.placeholder = '품목명';
    name.dataset.nameId = product.id;
    name.setAttribute('aria-label', '상품명');
    const price = document.createElement('input');
    price.type = 'number';
    price.min = '0';
    price.step = '100';
    price.inputMode = 'numeric';
    price.value = String(product.price);
    price.placeholder = '가격';
    price.dataset.priceId = product.id;
    price.setAttribute('aria-label', `${product.name} 가격`);
    const discount = document.createElement('input');
    discount.type = 'number';
    discount.min = '0';
    discount.max = '100';
    discount.step = '1';
    discount.inputMode = 'numeric';
    discount.value = String(getDiscountRate(product));
    discount.placeholder = '할인 %';
    discount.dataset.discountId = product.id;
    discount.setAttribute('aria-label', `${product.name} 할인율`);
    const remove = makeButton('삭제', { removeId: product.id });
    remove.setAttribute('aria-label', `${product.name} 삭제`);
    field.append(name, price, discount, remove);
    return field;
  }));
}

document.querySelector('#open-admin').addEventListener('click', () => {
  adminAuth.hidden = false;
  adminSettings.hidden = true;
  adminAuth.reset();
  adminAuthStatus.textContent = '';
  deletedDraftProduct = null;
  adminUndoDeleteButton.hidden = true;
  adminDialog.showModal();
  adminCode.focus();
});
document.querySelector('#close-admin').addEventListener('click', () => adminDialog.close());
adminDialog.addEventListener('click', (event) => { if (event.target === adminDialog) adminDialog.close(); });

adminAuth.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = adminAuth.querySelector('[type="submit"]');
  submitButton.disabled = true;
  adminAuthStatus.textContent = '인증을 확인하고 있습니다.';
  try {
    const response = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: adminCode.value }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      adminAuthStatus.textContent = result.error || '관리자 인증에 실패했습니다.';
      adminCode.select();
      return;
    }
    adminAuth.hidden = true;
    adminSettings.hidden = false;
    adminSessionToken = result.token || '';
    adminSettingsStatus.textContent = '';
    adminDraftProducts = products.map((product) => ({ ...product }));
    renderAdminSettings();
  } catch {
    adminAuthStatus.textContent = location.protocol === 'file:'
      ? '관리자 설정은 배포 주소에서 사용할 수 있습니다.'
      : '관리자 인증 서버에 연결하지 못했습니다.';
  } finally {
    submitButton.disabled = false;
  }
});

adminProductPrices.addEventListener('input', (event) => {
  const input = event.target;
  const id = input.dataset.nameId || input.dataset.priceId || input.dataset.discountId;
  if (!id) return;
  const product = adminDraftProducts.find((item) => item.id === id);
  if (input.dataset.nameId) product.name = input.value;
  if (input.dataset.priceId) product.price = Number(input.value);
  if (input.dataset.discountId) product.discountRate = Number(input.value);
});

adminProductPrices.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-id]');
  if (!button) return;
  const index = adminDraftProducts.findIndex((product) => product.id === button.dataset.removeId);
  if (index < 0) return;
  deletedDraftProduct = { product: { ...adminDraftProducts[index] }, index };
  adminDraftProducts.splice(index, 1);
  adminUndoDeleteButton.hidden = false;
  renderAdminSettings();
});

adminUndoDeleteButton.addEventListener('click', () => {
  if (!deletedDraftProduct) return;
  adminDraftProducts.splice(deletedDraftProduct.index, 0, deletedDraftProduct.product);
  deletedDraftProduct = null;
  adminUndoDeleteButton.hidden = true;
  adminSettingsStatus.textContent = '삭제한 품목을 복원했습니다.';
  renderAdminSettings();
});

document.querySelector('#admin-add-product').addEventListener('click', () => {
  const id = `fair-item-${Date.now()}-${adminDraftProducts.length}`;
  adminDraftProducts.push({ id, name: 'NEW OBJECT', price: 0, discountRate: 0 });
  renderAdminSettings();
  adminProductPrices.querySelector(`[data-name-id="${id}"]`).focus();
});

adminSettings.addEventListener('submit', async (event) => {
  event.preventDefault();
  const invalidProduct = !adminDraftProducts.length || adminDraftProducts.some((product) => (
    !product.name.trim()
    || !Number.isFinite(product.price)
    || product.price < 0
    || !Number.isFinite(product.discountRate)
    || product.discountRate < 0
    || product.discountRate > 100
  ));
  if (invalidProduct) {
    adminSettingsStatus.textContent = '품목명, 0원 이상의 가격, 0~100 할인율을 입력해 주세요.';
    return;
  }
  const nextProducts = adminDraftProducts.map((product) => ({
    ...product,
    name: product.name.trim(),
    price: Math.round(product.price),
    discountRate: Math.round(product.discountRate),
  }));
  const submitButton = adminSettings.querySelector('[type="submit"]');
  submitButton.disabled = true;
  adminSettingsStatus.textContent = '공유 설정을 저장하고 있습니다.';
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSessionToken}`,
      },
      body: JSON.stringify({ products: nextProducts }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      adminSettingsStatus.textContent = result.error || '공유 설정을 저장하지 못했습니다.';
      return;
    }
    applyProducts(result.products || nextProducts);
    adminDialog.close();
    status.textContent = '현장 가격·할인율·품목을 저장했습니다. 모든 기기에 반영됩니다.';
  } catch {
    adminSettingsStatus.textContent = location.protocol === 'file:'
      ? '공유 저장은 배포 주소에서 사용할 수 있습니다.'
      : '공유 설정 서버에 연결하지 못했습니다.';
  } finally {
    submitButton.disabled = false;
  }
});

if ('ResizeObserver' in window) {
  new ResizeObserver(syncDockOffset).observe(paymentDock);
} else {
  window.addEventListener('resize', syncDockOffset, { passive: true });
}

update();
loadSavedProducts();
