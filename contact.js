const contactForm = document.getElementById("contactForm");
const sendButton = contactForm.querySelector("button[type='submit']");

contactForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    // Prevent multiple submissions
    if (sendButton.disabled) {
        return;
    }

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // Show sending status
    sendButton.disabled = true;
    sendButton.textContent = "Sending...";

    try {
        const response = await fetch("/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                message: message
            })
        });

        const data = await response.json();

        if (response.ok) {

            // Clear form
            contactForm.reset();

            // Show success popup
            showPopup("Message sent successfully! ✅");

        } else {

            showPopup(data.message || "Failed to send message.");

        }

    } catch (error) {

        console.error("Error:", error);

        showPopup("Unable to send message. Please try again.");

    } finally {

        // Restore button
        sendButton.disabled = false;
        sendButton.textContent = "Send Message";
    }
});


// Show custom popup
function showPopup(message) {
    const popup = document.getElementById("successPopup");
    const popupMessage = document.getElementById("popupMessage");

    popupMessage.textContent = message;
    popup.classList.add("show");
}


// Close popup
function closePopup() {
    const popup = document.getElementById("successPopup");

    popup.classList.remove("show");
}