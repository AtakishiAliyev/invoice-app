const openForm = document.querySelector('#openForm');
const formWrapper = document.querySelector('.form-wrapper');
const overlay = document.querySelector('.form-overlay');
const select = document.querySelectorAll('.custom-select');
const form = document.querySelector('#form');
const invoice_date = document.querySelector('#invoice_date');
const options = document.querySelectorAll('.select-option');
const container = document.querySelector('.container');
const query = new URLSearchParams(window.location.search);
const id = query.get('id');
let cloneItem = document.querySelector(".item-data").cloneNode(true);
let itemParent = document.querySelector(".item-datalist");
let addItemBtn = document.querySelector(".add-item");
let isValid = true;

// * All data variable
const data = localStorage.getItem("data") ? JSON.parse(localStorage.getItem("data")) : [];

// * Return today date 
const date = new Date();
const today = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
invoice_date.value = today;

window.addEventListener('load', () => {
    const items = JSON.parse(localStorage.getItem('data'));

    items.forEach(item => {
        createItemBlock(item)
    })

    getUrl();
})

openForm.addEventListener('click', () => {
    formWrapper.classList.add('form-visible');
})

overlay.addEventListener('click', () => {
    formWrapper.classList.remove('form-visible');
})

// * Custom select 
select.forEach(select => {
    select.addEventListener('click', function () {
        const selected = this;
        selected.querySelector(".select-dropdown").classList.toggle('active');
        selected.querySelector(".select-value i").classList.toggle('active');

        options.forEach(option => {
            option.addEventListener('click', function () {
                selected.querySelector(".select-value span").innerText = this.innerText;
                const dataDay = option.getAttribute('data-day');
                selected.querySelector(".select-value span").setAttribute('data-day', dataDay);
            })
        })
    })
})

// * Form add new item
addItemBtn.addEventListener("click", addItem);

function addItem() {
    let item = document.querySelector(".item-data").cloneNode(true);
    item.querySelector("#item").value = "New Item";
    item.querySelector("#qty").value = "0";
    item.querySelector("#price").value = "0";
    item.querySelector("#total").value = "0.00";
    itemParent.append(item);
    calculateAll();
    removeItem();
}

//  * Form remove item
function removeItem() {
    let deleteItemBtn = document.querySelectorAll(".delete");
    deleteItemBtn.forEach(del => {
        del.addEventListener("click", function () {
            if (document.querySelectorAll(".delete").length > 1) {
                del.closest(".item-data").remove();
            }
        })
    })
}

// * Form submit event
form.addEventListener('submit', (e) => {
    e.preventDefault();
    getInvoice();
    getUrl();
    console.log(JSON.stringify(data, null, 2));
})

// * Get form data
function getInvoice() {
    const sender_street_adress = document.querySelector('#sender_street_adress');
    const sender_city = document.querySelector('#sender_city');
    const sender_post_code = document.querySelector('#sender_post_code');
    const sender_country = document.querySelector('#sender_country');
    const userName = document.querySelector('#userName');
    const userEmail = document.querySelector('#userEmail');
    const client_adress = document.querySelector('#client_adress');
    const client_city = document.querySelector('#client_city');
    const client_post_code = document.querySelector('#client_post_code');
    const client_country = document.querySelector('#client_country');
    const invoice_date = document.querySelector('#invoice_date');
    const description = document.querySelector('#description');
    isValid = true;

    checkEmpty([
        sender_street_adress,
        sender_city,
        sender_post_code,
        sender_country,
        userName,
        client_adress,
        client_city,
        client_post_code,
        client_country,
        description
    ]);

    checkEmailInput(userEmail);

    if (isValid) {
        const result = getInvoiceValues([
            sender_street_adress,
            sender_city,
            sender_post_code,
            sender_country,
            userName,
            userEmail,
            client_adress,
            client_city,
            client_post_code,
            client_country,
            description,
            invoice_date,
        ])

        data.push(result);
        localStorage.setItem('data', JSON.stringify(data))
        formWrapper.classList.remove('form-visible');

        emptyForm();

        createItemBlock(result);
        getInvoiceCount();
    }

    getItemsTotal()
}

// * Check empty input
function checkEmpty(inputList) {
    inputList.forEach(input => {
        if (input.value.trim().length == 0) {
            input.previousElementSibling.children[0].classList.add('active');
            isValid = false;
        } else {
            input.previousElementSibling.children[0].classList.remove('active');
        }
    })
}

function isEmail(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}

// * Check email input
function checkEmailInput(input) {
    {
        if (input.value.trim().length == 0) {
            input.previousElementSibling.children[0].classList.add('active');
            input.previousElementSibling.children[0].innerText = "can't be empty";
            isValid = false;

        } else if (!isEmail(input.value)) {
            input.previousElementSibling.children[0].classList.add('active');
            input.previousElementSibling.children[0].innerText = "Invalid email";
            isValid = false;

        } else {
            input.previousElementSibling.children[0].classList.remove('active');
            input.previousElementSibling.children[0].innerText = "can't be empty";
        }
    }
}

// * Get form elements values create object
function getInvoiceValues(inputList) {
    const obj = {};
    const senderAddress = {};
    const clientAddress = {};
    const paymentTerms = document.querySelector('#payment_terms span').getAttribute('data-day');

    inputList.forEach(input => {
        if (input.id.includes('sender')) {
            senderAddress[input.id.replace('sender_', "")] = input.value;
            obj.senderAddress = senderAddress;
        } else if (input.id.includes('client')) {
            clientAddress[input.id.replace('client_', "")] = input.value;
            obj.clientAddress = clientAddress;
        } else {
            obj[input.id] = input.value;
            obj.status = "pending";
            obj.paymentTerms = Number(paymentTerms);
        }
    })

    const items = getItemValue();
    obj.items = items;
    const total = getItemsTotal();
    obj.total = total;
    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    obj.id = id;

    return obj
}

// * Get form items values
function getItemValue() {
    const itemList = document.querySelectorAll('.item-data');
    const items = [];

    itemList.forEach(item => {
        const obj = {};

        const input = item.querySelectorAll('input');

        input.forEach(el => {
            obj[el.id] = el.value;
        })

        items.push(obj)
    })

    return items
}

//  * Calculate form item total
function calculateAll() {
    const qty = document.querySelectorAll('#qty');
    const price = document.querySelectorAll('#price');
    calcTotal(qty, price);
    calcTotal(price, qty);
}

function calcTotal(a, b) {
    a.forEach(item => {
        item.addEventListener('keyup', () => {
            const x = item.value;
            const y = item.parentElement.parentElement.querySelector(`#${b[0].id}`).value;
            let total = item.parentElement.parentElement.querySelector('#total');
            total.value = +x * +y;
        })
    })
}

function getItemsTotal() {
    const items = getItemValue();

    const total = items.reduce((sum, item) => {
        return +sum + +item.total
    }, 0)

    return total;
}

calculateAll();

// * Reset form data
function emptyForm() {
    let allItem = document.querySelectorAll(".item-data");
    form.reset();
    invoice_date.value = today;
    document.querySelector(".select-value span").innerText = options[0].innerText;
    allItem.forEach(item => {
        item.remove();
    });
    itemParent.append(cloneItem);
}

//  * Create invoice items list (home page)
function createItemBlock(data) {
    const invoice_items = document.querySelector('.invoice_items');

    const item =
        `<div class="item" data-id="${data.id}">
        <div class="id">
            <span>#</span>
            <p>${data.id}</p>
        </div>
        <div class="date">
            <p>${data.invoice_date}</p>
        </div>
        <div class="name">
            <p>${data.userName}</p>
        </div>
        <div class="total">
            <p>$${Number(data.total).toFixed(2)}</p>
        </div>
        <div class="status">
            <div class="status_block ${data.status}">
                <span></span>
                <p>${data.status}</p>
            </div>
            <img class="arrow-image" src="https://invoice-app-flame.vercel.app/assets/icon-arrow-right.svg">
        </div>
    </div>`;

    if (invoice_items) { 
        invoice_items.innerHTML += item;
    }
    
    getInvoiceCount();
}


// * Create Details Page
function getDetails() {
    if (id) {
        const result = data.find(item => {
            if (item.id == id) {
                return true
            }
        })
    
        let tableQty = '';
    
        result.items.forEach(el => {
            tableQty +=
                `<tr>
                    <td>${el.item}</td>
                    <td>${el.qty}</td>
                    <td>$${Number(el.price).toFixed(2)}</td>
                    <td>$${Number(el.total).toFixed(2)}</td>
                </tr>`;
        })

        function checkStatus(item) {
            if(item.status == 'pending') {
                return `<button class="btn btn-main" id="changeStatus">Mark as Paid</button>`;
            } else {
                return '';
            }
        }
    
        const details = `
                <div class="invoice-details" data-id="${result.id}">
                    <div class="go-back">
                        <button class="goback-btn">
                            <img src="https://invoice-app-flame.vercel.app/assets/icon-arrow-left.svg">
                            <span>Go Back</span>
                        </button>
                    </div>
                    <div class="head">
                        <div class="status">
                            <p>Status</p>
                            <div class="status_block ${result.status}">
                                <span></span>
                                <p>${result.status}</p>
                            </div>
                        </div>
                        <div class="buttons">
                            <button class="btn">Edit</button>
                            <button class="btn btn-danger" id="deleteItem">Delete</button>
                            ${checkStatus(result)}
                        </div>
                    </div>
                    <div class="details-body">
                        <div class="summary">
                            <div class="id">
                                <p> <span>#</span>${result.id}</p>
                                <p>${result.description}</p>
                            </div>
                            <div class="adress">
                                <p>${result.senderAddress.street_adress}</p>
                                <p>${result.senderAddress.city}</p>
                                <p>${result.senderAddress.post_code}</p>
                                <p>${result.senderAddress.country}</p>
                            </div>
                        </div>
    
                        <div class="billing-information">
                            <div class="info">
                                <p>Bill To</p>
                                <h3>${result.userName}</h3>
                                <p>${result.clientAddress.adress}</p>
                                <p>${result.clientAddress.city}</p>
                                <p>${result.clientAddress.post_code}</p>
                                <p>${result.clientAddress.country}</p>
                            </div>
                            <div class="info">
                                <p>Sent To</p>
                                <h3>${result.userEmail}</h3>
                            </div>
                            <div class="info">
                                <p>Invoice Date</p>
                                <h3>${result.invoice_date}</h3>
                            </div>
                        </div>
    
                        <table class="info-payment">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>QTY.</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableQty}
                            </tbody>
                        </table>
                        <div class="info-subtotal">
                            <p>Amount Due</p>
                            <h2>$${Number(result.total).toFixed(2)}</h2>
                        </div>
                    </div>
                </div>`;

        container.innerHTML = details;
        changeStatus();
        deleteListItem();
        goBackUrl();
    }
}

function getUrl() {
    const invoiceItem = document.querySelectorAll('.item');
    invoiceItem.forEach((item) => {
        item.addEventListener('click', () => {
            const id = item.getAttribute('data-id');
            console.log(id);
            window.location += `?id=${id}`;
            getDetails();
        })
    })
}

getDetails()

// * Go back
function goBackUrl() {
    const goBackBtn = document.querySelector('.goback-btn');
    goBackBtn.addEventListener('click', () => {
        history.back();
    })
}

// * Mark as paid 
function changeStatus() {
    const changeStatusBtn = document.querySelector('#changeStatus');
    
    if(changeStatusBtn) {
        changeStatusBtn.addEventListener('click', function () {
            const id = this.closest('.invoice-details').getAttribute('data-id');
            const status_block = document.querySelector('.status_block');
    
            const selectedItem = data.find(item => {
                if(item.id == id ) {
                    status_block.classList.remove(item.status);
    
                    item.status = 'paid';
                    localStorage.setItem('data', JSON.stringify(data));
    
                    status_block.classList.add(item.status);
                    status_block.querySelector('p').innerText = item.status;
                    this.remove();
                }
            })
        })
    }
}

// * Delete list item
function deleteListItem() {
    const baseUrl = window.location.origin;
    const deleteItemBtn = document.querySelector('#deleteItem');

    deleteItemBtn.addEventListener('click', function () {
        const id = this.closest('.invoice-details').getAttribute('data-id');

        console.log(id);

        const selectedItem = data.find((item, index) => {
            if(item.id == id ) {
                data.splice(index, 1);
                localStorage.setItem('data', JSON.stringify(data));
                window.location.href = baseUrl;
            }
        })
    })
}

// * Total invoice count
function getInvoiceCount() {
    const countText = document.querySelector('.invoice-count');
    const invoiceCount = document.querySelectorAll('.invoice_items .item');

    countText.innerText = invoiceCount.length;
}