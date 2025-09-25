document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    let userData = JSON.parse(localStorage.getItem('userData')) || { loggedIn: false };

    const saveUserData = () => {
        localStorage.setItem('userData', JSON.stringify(userData));
    };

    // --- New Verification and Account Management Functions ---

    const generateVerificationKey = () => Math.floor(1000 + Math.random() * 9000).toString();

    const loginUser = (email, password) => {
        if (userData[email] && userData[email].password === password) {
            userData.loggedIn = true;
            userData.currentUserEmail = email;
            saveUserData();
            window.location.href = 'index.html';
        } else {
            alert('Invalid email or password.');
        }
    };

    const signupUser = (name, surname, email) => {
        if (userData[email] && userData[email].isVerified) {
            alert('An account with this email already exists.');
            return;
        }

        const verificationKey = generateVerificationKey();

        userData[email] = {
            name: name,
            surname: surname,
            email: email,
            password: null,
            address: '',
            transactions: [],
            isVerified: false,
            verificationKey: verificationKey
        };
        saveUserData();
        alert(`A verification key has been "sent" to ${email}. Your key is: ${verificationKey}`);
        window.location.href = 'email-sent.html';
    };

    const verifyKey = (email, key) => {
        if (userData[email] && userData[email].verificationKey === key) {
            userData.tempUserEmail = email; // Store email temporarily for password creation
            saveUserData();
            return true;
        } else {
            alert('Invalid email or key.');
            return false;
        }
    };

    const createPassword = (password) => {
        const email = userData.tempUserEmail;
        if (!email) {
            alert('Session expired. Please try again from the start.');
            window.location.href = 'login.html';
            return;
        }

        userData[email].password = password;
        userData[email].isVerified = true;
        userData.loggedIn = true;
        userData.currentUserEmail = email;
        delete userData[email].verificationKey;
        delete userData.tempUserEmail;
        saveUserData();
        alert('Password set successfully! You are now logged in.');
        window.location.href = 'index.html';
    };

    const logoutUser = () => {
        userData.loggedIn = false;
        userData.currentUserEmail = null;
        saveUserData();
        window.location.href = 'login.html';
    };

    // --- Core Website Functions ---

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

    if (currentPage === 'login.html') {
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            loginUser(document.getElementById('login-email').value, document.getElementById('login-password').value);
        });
    } else if (currentPage === 'signup.html') {
        document.getElementById('signup-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            signupUser(document.getElementById('signup-name').value, document.getElementById('signup-surname').value, document.getElementById('signup-email').value);
        });
    } else if (currentPage === 'verify-code.html') {
        document.getElementById('verify-code-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('verify-email').value;
            const key = document.getElementById('verification-key').value;
            if (verifyKey(email, key)) {
                window.location.href = 'create-password.html';
            }
        });
    } else if (currentPage === 'create-password.html') {
        document.getElementById('create-password-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }
            createPassword(password);
        });
    } else if (currentPage === 'forgot-password.html') {
        document.getElementById('forgot-password-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('reset-email').value;
            if (userData[email]) {
                const resetKey = generateVerificationKey();
                userData[email].verificationKey = resetKey;
                userData.tempUserEmail = email;
                saveUserData();
                alert(`A password reset key has been "sent" to ${email}. Your key is: ${resetKey}`);
                window.location.href = 'verify-code.html';
            } else {
                alert('Email not found.');
            }
        });
    } else if (currentPage === 'index.html') {
        if (!userData.loggedIn) {
            window.location.href = 'login.html';
            return;
        }

        const currentUser = userData[userData.currentUserEmail];
        document.getElementById('profile-name-display').textContent = `Hello, ${currentUser.name}!`;
        document.getElementById('profile-email-display').textContent = currentUser.email;
        document.getElementById('logout-btn').addEventListener('click', logoutUser);

        const updateAll = () => {
            const transactions = currentUser.transactions;
            const today = new Date().toISOString().slice(0, 7);
            const filteredTransactions = transactions.filter(t => t.date && t.date.startsWith(today));

            const totalIncome = filteredTransactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : 0), 0);
            const totalExpenses = filteredTransactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);
            const netSavings = totalIncome - totalExpenses;

            document.getElementById('total-income').textContent = `R${totalIncome.toFixed(2)}`;
            document.getElementById('total-expenses').textContent = `R${totalExpenses.toFixed(2)}`;
            document.getElementById('net-savings').textContent = `R${netSavings.toFixed(2)}`;

            const budgetChartCanvas = document.getElementById('budget-chart');
            const savingsChartCanvas = document.getElementById('savings-chart');
            const transactionsGridContainer = document.getElementById('transactions-grid-container');

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
                filteredTransactions.forEach((t, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${t.type}</td>
                        <td>${t.amount.toFixed(2)}</td>
                        <td>${t.category || 'N/A'}</td>
                        <td>${t.date}</td>
                        <td><button class="delete-btn-grid" data-index="${index}">Delete</button></td>
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
                budgetChart = new Chart(budgetChartCanvas, { type: 'pie', data: data });
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
                savingsChart = new Chart(savingsChartCanvas, { type: 'doughnut', data: data });
            };

            setupBudgetChart(filteredTransactions);
            setupSavingsChart(totalIncome, netSavings);
            renderTransactionsGrid(filteredTransactions);
            transactionsGridContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn-grid')) {
                    const index = e.target.getAttribute('data-index');
                    currentUser.transactions.splice(index, 1);
                    saveUserData();
                    updateAll();
                }
            });
        };
        updateAll();
    } else if (currentPage === 'settings.html') {
        if (!userData.loggedIn) {
            window.location.href = 'login.html';
            return;
        }
        const currentUser = userData[userData.currentUserEmail];
        document.getElementById('profile-name-display').textContent = `Hello, ${currentUser.name}!`;
        document.getElementById('profile-email-display').textContent = currentUser.email;
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-surname').textContent = currentUser.surname;
        document.getElementById('user-email-info').textContent = currentUser.email;
        document.getElementById('user-address').textContent = currentUser.address || 'Not specified';
        document.getElementById('logout-btn').addEventListener('click', logoutUser);

        document.getElementById('update-profile-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            currentUser.address = document.getElementById('update-address').value;
            saveUserData();
            document.getElementById('user-address').textContent = currentUser.address;
            alert('Address updated successfully!');
        });

        document.getElementById('password-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('old-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (oldPassword !== currentUser.password) { alert('Old password is not correct.'); return; }
            if (newPassword !== confirmPassword) { alert('New passwords do not match.'); return; }
            currentUser.password = newPassword;
            saveUserData();
            alert('Password updated successfully!');
        });
    } else if (currentPage === 'categories.html') {
        if (!userData.loggedIn) {
            window.location.href = 'login.html';
            return;
        }
        const currentUser = userData[userData.currentUserEmail];
        document.getElementById('profile-name-display').textContent = `Hello, ${currentUser.name}!`;
        document.getElementById('profile-email-display').textContent = currentUser.email;
        document.getElementById('logout-btn').addEventListener('click', logoutUser);

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
                    alert('Please enter a valid amount.');
                    return;
                }
                const newTransaction = {
                    amount,
                    type: e.target.dataset.categoryType,
                    category: e.target.dataset.categoryName,
                    date: new Date().toISOString().slice(0, 7)
                };
                currentUser.transactions.push(newTransaction);
                saveUserData();
                alert(`Added R${amount} to ${newTransaction.category}`);
                e.target.value = '';
            });
        });
    } else if (currentPage === 'predictor.html') {
        if (!userData.loggedIn) {
            window.location.href = 'login.html';
            return;
        }
        const currentUser = userData[userData.currentUserEmail];
        document.getElementById('profile-name-display').textContent = `Hello, ${currentUser.name}!`;
        document.getElementById('profile-email-display').textContent = currentUser.email;
        document.getElementById('logout-btn').addEventListener('click', logoutUser);

        const predictedChartCanvas = document.getElementById('predicted-chart');
        const adviceOutput = document.getElementById('advice-output');

        const { data, averageNetSavings } = predictBudget(currentUser.transactions);

        if (data.labels.length > 0) {
            new Chart(predictedChartCanvas, {
                type: 'bar',
                data: data,
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
            adviceOutput.textContent = getAdvice(averageNetSavings, {});
        } else {
            adviceOutput.textContent = 'Not enough data for a prediction. Please add transactions over a few months to see a forecast!';
        }
    } else if (currentPage === 'contact.html') {
        if (!userData.loggedIn) {
            window.location.href = 'login.html';
            return;
        }
        const currentUser = userData[userData.currentUserEmail];
        document.getElementById('profile-name-display').textContent = `Hello, ${currentUser.name}!`;
        document.getElementById('profile-email-display').textContent = currentUser.email;
        document.getElementById('logout-btn').addEventListener('click', logoutUser);
    }
});