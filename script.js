document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    // New, more robust data structure
    const getAppState = () => {
        try {
            const data = JSON.parse(localStorage.getItem('appState'));
            return data || {
                currentUser: null,
                users: {}
            };
        } catch (e) {
            console.error("Failed to parse localStorage data:", e);
            return {
                currentUser: null,
                users: {}
            };
        }
    };

    let appState = getAppState();

    const saveAppState = () => {
        try {
            localStorage.setItem('appState', JSON.stringify(appState));
        } catch (e) {
            console.error("Failed to save data to localStorage:", e);
        }
    };

    // --- Core Functions ---

    const generateUniqueId = () => Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    const getElement = (id, page) => {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID '${id}' not found on ${page}.`);
        }
        return element;
    };

    const displayFeedback = (elementId, message, isSuccess = true) => {
        const element = getElement(elementId, currentPage);
        if (element) {
            element.textContent = message;
            element.className = `feedback-message ${isSuccess ? 'success' : 'error'}`;
        }
    };

    const loginUser = (email, password) => {
        displayFeedback('login-feedback', '', true);
        const user = appState.users[email];
        if (user && user.password === password) {
            appState.currentUser = email;
            saveAppState();
            window.location.href = 'index.html';
        } else {
            displayFeedback('login-feedback', 'Invalid email or password.', false);
        }
    };

    const signupUser = (name, surname, email) => {
        if (appState.users[email]) {
            displayFeedback('signup-feedback', 'An account with this email already exists.', false);
            return;
        }

        const verificationKey = Math.floor(1000 + Math.random() * 9000).toString();
        
        appState.users[email] = {
            name,
            surname,
            email,
            password: null,
            address: '',
            transactions: [],
            isVerified: false,
            verificationKey
        };
        saveAppState();

        // New UI feedback instead of alert()
        displayFeedback('signup-feedback', `A verification key has been sent to ${email}.`, true);
        setTimeout(() => {
            window.location.href = 'email-sent.html';
        }, 2000); // Redirect after a short delay
    };

    const verifyKey = (email, key) => {
        const user = appState.users[email];
        if (user && user.verificationKey === key) {
            appState.tempUserEmail = email;
            saveAppState();
            return true;
        } else {
            return false;
        }
    };

    const createPassword = (password) => {
        const email = appState.tempUserEmail;
        if (!email || !appState.users[email]) {
            displayFeedback('create-password-feedback', 'Session expired. Please try again.', false);
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        const user = appState.users[email];
        user.password = password;
        user.isVerified = true;
        appState.currentUser = email;
        delete user.verificationKey;
        delete appState.tempUserEmail;
        saveAppState();
        displayFeedback('create-password-feedback', 'Password set successfully! You are now logged in.', true);
        setTimeout(() => window.location.href = 'index.html', 2000);
    };

    const forgotPassword = (email) => {
        const user = appState.users[email];
        if (user) {
            const resetKey = Math.floor(1000 + Math.random() * 9000).toString();
            user.verificationKey = resetKey;
            appState.tempUserEmail = email;
            saveAppState();
            displayFeedback('forgot-password-feedback', `A password reset key has been sent to ${email}.`, true);
            setTimeout(() => window.location.href = 'verify-code.html', 2000);
        } else {
            displayFeedback('forgot-password-feedback', 'Email not found.', false);
        }
    };
    
    const logoutUser = () => {
        appState.currentUser = null;
        saveAppState();
        window.location.href = 'login.html';
    };

    const getAdvice = (netSavings, expenses) => {
        const sortedExpenses = Object.entries(expenses).sort(([, a], [, b]) => b - a);
        let topExpense = sortedExpenses.length > 0 ? sortedExpenses[0][0] : 'N/A';

        if (netSavings > 0) {
            return `Great job! You are saving money. Your biggest expense is ${topExpense}, consider reducing spending in this area to save even more.`;
        } else if (netSavings < 0) {
            return `It seems your expenses are higher than your income. To improve your budget, focus on reducing spending on ${topExpense}, which is your highest expense.`;
        } else {
            return `Your income and expenses are balanced. Keep tracking to identify areas for potential savings!`;
        }
    };

    const predictBudget = (transactions) => {
        const monthsData = {};
        const now = new Date();
        const lastThreeMonths = [
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`,
            `${now.getFullYear()}-${String(now.getMonth() - 1).padStart(2, '0')}`
        ].filter(month => {
            const [year, mon] = month.split('-').map(Number);
            return mon > 0 && mon < 13;
        });

        transactions.forEach(t => {
            const month = t.date.substring(0, 7);
            if (!monthsData[month]) {
                monthsData[month] = { income: 0, expenses: 0 };
            }
            if (t.type === 'income') {
                monthsData[month].income += t.amount;
            } else {
                monthsData[month].expenses += t.amount;
            }
        });

        const pastMonthsNet = lastThreeMonths.map(month => {
            const data = monthsData[month] || { income: 0, expenses: 0 };
            return data.income - data.expenses;
        }).filter(net => !isNaN(net));

        if (pastMonthsNet.length === 0) {
            return { labels: [], datasets: [] };
        }

        const averageNetSavings = pastMonthsNet.reduce((sum, net) => sum + net, 0) / pastMonthsNet.length;
        const predictedSavings = averageNetSavings;

        const data = {
            labels: ['Last 3 Months Average', 'Predicted Next Month'],
            datasets: [{
                label: 'Net Budget (ZAR)',
                data: [averageNetSavings, predictedSavings],
                backgroundColor: ['#3498db', '#2ecc71'],
                borderColor: ['#3498db', '#2ecc71'],
                borderWidth: 1
            }]
        };
        return { data, averageNetSavings };
    };

    // --- Routing and Event Handling ---
    if (currentPage !== 'login.html' && currentPage !== 'signup.html' && currentPage !== 'email-sent.html' && !appState.currentUser) {
        window.location.href = 'login.html';
        return;
    }

    const currentUser = appState.users[appState.currentUser];

    if (currentPage === 'login.html') {
        getElement('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            loginUser(getElement('login-email').value, getElement('login-password').value);
        });
    } else if (currentPage === 'signup.html') {
        getElement('signup-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            signupUser(getElement('signup-name').value, getElement('signup-surname').value, getElement('signup-email').value);
        });
    } else if (currentPage === 'verify-code.html') {
        getElement('verify-code-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = getElement('verify-email').value;
            const key = getElement('verification-key').value;
            if (verifyKey(email, key)) {
                window.location.href = 'create-password.html';
            } else {
                alert('Invalid email or key. Please try again.');
            }
        });
    } else if (currentPage === 'create-password.html') {
        getElement('create-password-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = getElement('password').value;
            const confirmPassword = getElement('confirm-password').value;
            if (password !== confirmPassword) {
                displayFeedback('create-password-feedback', 'Passwords do not match.', false);
                return;
            }
            createPassword(password);
        });
    } else if (currentPage === 'forgot-password.html') {
        getElement('forgot-password-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            forgotPassword(getElement('reset-email').value);
        });
    } else if (currentPage === 'index.html') {
        getElement('profile-name-display').textContent = `Hello, ${currentUser.name}!`;
        getElement('profile-email-display').textContent = currentUser.email;
        getElement('logout-btn')?.addEventListener('click', logoutUser);

        const updateAll = () => {
            const transactions = currentUser.transactions;
            const today = new Date().toISOString().slice(0, 7);
            const filteredTransactions = transactions.filter(t => t.date && t.date.startsWith(today));

            const totalIncome = filteredTransactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : 0), 0);
            const totalExpenses = filteredTransactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);
            const netSavings = totalIncome - totalExpenses;

            getElement('total-income').textContent = `R${totalIncome.toFixed(2)}`;
            getElement('total-expenses').textContent = `R${totalExpenses.toFixed(2)}`;
            getElement('net-savings').textContent = `R${netSavings.toFixed(2)}`;

            const budgetChartCanvas = getElement('budget-chart');
            const savingsChartCanvas = getElement('savings-chart');
            const transactionsGridContainer = getElement('transactions-grid-container');

            let budgetChart, savingsChart;

            const renderTransactionsGrid = (filteredTransactions) => {
                transactionsGridContainer.innerHTML = '';
                if (filteredTransactions.length === 0) {
                    transactionsGridContainer.innerHTML = '<p>No transactions for this month yet.</p>';
                    return;
                }

                const table = document.createElement('table');
                table.id = 'transactions-grid';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Amount (ZAR)</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;

                const tbody = table.querySelector('tbody');
                filteredTransactions.forEach(t => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${t.type}</td>
                        <td>${t.amount.toFixed(2)}</td>
                        <td>${t.category || 'N/A'}</td>
                        <td>${t.date.slice(0, 10)}</td>
                        <td><button class="delete-btn-grid" data-id="${t.id}">Delete</button></td>
                    `;
                    tbody.appendChild(row);
                });

                transactionsGridContainer.appendChild(table);
            };

            const setupBudgetChart = (filteredTransactions) => {
                const expenseCategories = {};
                filteredTransactions.forEach(t => {
                    if (t.type === 'expense' && t.category) {
                        if (!expenseCategories[t.category]) {
                            expenseCategories[t.category] = 0;
                        }
                        expenseCategories[t.category] += t.amount;
                    }
                });

                const data = {
                    labels: Object.keys(expenseCategories),
                    datasets: [{
                        data: Object.values(expenseCategories),
                        backgroundColor: ['#00BFFF', '#1E90FF', '#87CEFA', '#ADD8E6', '#B0E0E6'],
                        hoverOffset: 4
                    }]
                };

                if (budgetChart) budgetChart.destroy();
                if (typeof Chart !== 'undefined') {
                    budgetChart = new Chart(budgetChartCanvas, { type: 'pie', data: data });
                } else {
                    console.error("Chart.js not loaded. Cannot render chart.");
                }
            };

            const setupSavingsChart = (totalIncome, netSavings) => {
                const spent = totalIncome > 0 ? totalIncome - netSavings : 0;
                const saved = netSavings > 0 ? netSavings : 0;

                const data = {
                    labels: ['Saved', 'Spent'],
                    datasets: [{
                        data: [saved, spent],
                        backgroundColor: ['#00BFFF', '#1E90FF'],
                        hoverOffset: 4
                    }]
                };

                if (savingsChart) savingsChart.destroy();
                if (typeof Chart !== 'undefined') {
                    savingsChart = new Chart(savingsChartCanvas, { type: 'doughnut', data: data });
                } else {
                    console.error("Chart.js not loaded. Cannot render chart.");
                }
            };

            setupBudgetChart(filteredTransactions);
            setupSavingsChart(totalIncome, netSavings);
            renderTransactionsGrid(filteredTransactions);
            transactionsGridContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn-grid')) {
                    const transactionId = e.target.getAttribute('data-id');
                    const transactionIndex = currentUser.transactions.findIndex(t => t.id === transactionId);
                    
                    if (transactionIndex !== -1) {
                        currentUser.transactions.splice(transactionIndex, 1);
                        saveAppState();
                        updateAll();
                    }
                }
            });
        };
        updateAll();
    } else if (currentPage === 'settings.html') {
        getElement('profile-name-display').textContent = `Hello, ${currentUser.name}!`;
        getElement('profile-email-display').textContent = currentUser.email;
        getElement('user-name').textContent = currentUser.name;
        getElement('user-surname').textContent = currentUser.surname;
        getElement('user-email-info').textContent = currentUser.email;
        getElement('user-address').textContent = currentUser.address || 'Not specified';
        getElement('logout-btn')?.addEventListener('click', logoutUser);

        getElement('update-profile-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            currentUser.address = getElement('update-address').value;
            saveAppState();
            getElement('user-address').textContent = currentUser.address;
            alert('Address updated successfully!');
        });

        getElement('password-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const oldPassword = getElement('old-password').value;
            const newPassword = getElement('new-password').value;
            const confirmPassword = getElement('confirm-password').value;
            if (oldPassword !== currentUser.password) { alert('Old password is not correct.'); return; }
            if (newPassword !== confirmPassword) { alert('New passwords do not match.'); return; }
            currentUser.password = newPassword;
            saveAppState();
            alert('Password updated successfully!');
        });
    } else if (currentPage === 'categories.html') {
        getElement('profile-name-display').textContent = `Hello, ${currentUser.name}!`;
        getElement('profile-email-display').textContent = currentUser.email;
        getElement('logout-btn')?.addEventListener('click', logoutUser);

        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                const subcategoryList = header.nextElementSibling;
                document.querySelectorAll('.subcategory-list.active').forEach(list => {
                    if (list !== subcategoryList) {
                        list.classList.remove('active');
                    }
                });
                subcategoryList.classList.toggle('active');
            });
        });

        document.querySelectorAll('.category-amount-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const amount = parseFloat(e.target.value);
                if (isNaN(amount) || amount <= 0) {
                    displayFeedback('category-feedback', 'Please enter a valid amount.', false);
                    return;
                }
                const newTransaction = {
                    id: generateUniqueId(),
                    amount,
                    type: e.target.dataset.categoryType,
                    category: e.target.dataset.categoryName,
                    date: new Date().toISOString()
                };
                currentUser.transactions.push(newTransaction);
                saveAppState();
                displayFeedback('category-feedback', `Added R${amount} to ${newTransaction.category}`, true);
                e.target.value = '';
            });
        });
    } else if (currentPage === 'predictor.html') {
        getElement('profile-name-display').textContent = `Hello, ${currentUser.name}!`;
        getElement('profile-email-display').textContent = currentUser.email;
        getElement('logout-btn')?.addEventListener('click', logoutUser);

        const predictedChartCanvas = getElement('predicted-chart');
        const adviceOutput = getElement('advice-output');

        const { data, averageNetSavings } = predictBudget(currentUser.transactions);

        if (data.labels.length > 0) {
            if (typeof Chart !== 'undefined') {
                new Chart(predictedChartCanvas, {
                    type: 'bar',
                    data: data,
                    options: {
                        responsive: true,
                        scales: { y: { beginAtZero: true } }
                    }
                });
            } else {
                console.error("Chart.js not loaded. Cannot render chart.");
            }
            
            const expenseCategories = {};
            currentUser.transactions.forEach(t => {
                if (t.type === 'expense' && t.category) {
                    if (!expenseCategories[t.category]) {
                        expenseCategories[t.category] = 0;
                    }
                    expenseCategories[t.category] += t.amount;
                }
            });
            adviceOutput.textContent = getAdvice(averageNetSavings, expenseCategories);
        } else {
            adviceOutput.textContent = 'Not enough data for a prediction. Please add transactions over a few months to see a forecast!';
        }
    } else if (currentPage === 'contact.html') {
        getElement('profile-name-display').textContent = `Hello, ${currentUser.name}!`;
        getElement('profile-email-display').textContent = currentUser.email;
        getElement('logout-btn')?.addEventListener('click', logoutUser);
    }
});