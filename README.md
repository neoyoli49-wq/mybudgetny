# My Budget Planner NY

This is a local budget planning website created with HTML, CSS, and JavaScript.

---

## File Checklist

Your project folder should contain exactly these files. The names must be in lowercase.

* `index.html` (Dashboard)
* `login.html`
* `signup.html`
* `email-sent.html`
* `verify-code.html`
* `create-password.html`
* `forgot-password.html`
* `categories.html`
* `predictor.html`
* `settings.html`
* `contact.html`
* `style.css`
* `script.js`

---

## How to Run the Website

To run this website, you need a local server. The easiest way to do this is with the **Live Server** extension in Visual Studio Code.

1.  Make sure you have the **Live Server** extension installed in Visual Studio Code.
2.  Open your project folder (`mybudgetny`) in Visual Studio Code by going to **File > Open Folder...**.
3.  Find `index.html` in the list of files on the left.
4.  **Right-click on `index.html`** and select **Open with Live Server**.

Your website will automatically open in your browser, and everything should work correctly.

---

## Troubleshooting

If you encounter an error, here are the most common solutions:

* **Error: "Cannot GET /..."**
    * This means the server is looking for files in the wrong place. You must start Live Server by **right-clicking on `index.html`** in your file list. Do not right-click on the folder itself.

* **Problem: "Nothing is working when I click a button or link."**
    * This is almost always a file-linking issue. Check your `index.html` and other HTML files to make sure the script tag is exactly correct: `<script src="script.js"></script>`. Also, verify that the `script.js` file is in the same folder and has no typos in its name.