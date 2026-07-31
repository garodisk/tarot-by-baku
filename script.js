const header = document.querySelector("[data-header]");
const toggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

toggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  header.classList.toggle("nav-visible", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    header.classList.remove("nav-visible");
    toggle.setAttribute("aria-expanded", "false");
  });
});

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const feedbackForm = document.querySelector("[data-feedback-form]");
const feedbackList = document.querySelector("[data-feedback-list]");
const supabaseUrl = "https://nsnpnmouhjvvmgmlkgos.supabase.co";
const supabaseKey = "sb_publishable_pVSY7SB7CK5rBcov82gxmg_5ONLUXG7";
const supabaseHeaders = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
};

async function loadRecentFeedback() {
  if (!feedbackList) return;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/feedback?select=rating,name,message,created_at&approved=eq.true&order=created_at.desc&limit=5`,
      { headers: supabaseHeaders }
    );

    if (!response.ok) throw new Error("Unable to load feedback");

    const reviews = await response.json();
    feedbackList.replaceChildren();

    if (!reviews.length) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "feedback-empty";
      emptyMessage.textContent = "Approved reviews will appear here soon.";
      feedbackList.append(emptyMessage);
      return;
    }

    reviews.forEach((review) => {
      const card = document.createElement("article");
      card.className = "feedback-card";

      const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
      const stars = document.createElement("div");
      stars.className = "feedback-card-stars";
      stars.setAttribute("aria-label", `${rating} out of 5 stars`);
      stars.textContent = "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);

      const quote = document.createElement("p");
      quote.textContent = review.message || "Thank you for sharing your experience.";

      const footer = document.createElement("footer");
      const reviewer = document.createElement("strong");
      reviewer.textContent = review.name || "Anonymous";
      const date = document.createElement("time");
      date.dateTime = review.created_at;
      date.textContent = new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(review.created_at));

      footer.append(reviewer, date);
      card.append(stars, quote, footer);
      feedbackList.append(card);
    });
  } catch (error) {
    const errorMessage = document.createElement("p");
    errorMessage.className = "feedback-empty";
    errorMessage.textContent = "Reviews are unavailable right now.";
    feedbackList.replaceChildren(errorMessage);
  }
}

if (feedbackForm) {
  const ratingButtons = [...feedbackForm.querySelectorAll("[data-rating]")];
  const ratingInput = feedbackForm.querySelector("[data-rating-input]");
  const ratingLabel = feedbackForm.querySelector("[data-rating-label]");
  const feedbackStatus = feedbackForm.querySelector("[data-feedback-status]");
  const ratingMessages = ["Could be better", "Fair", "Good", "Very good", "Wonderful"];

  function selectRating(rating) {
    ratingInput.value = String(rating);
    ratingButtons.forEach((button) => {
      const isSelected = Number(button.dataset.rating) <= rating;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(Number(button.dataset.rating) === rating));
    });
    ratingLabel.textContent = `${rating} out of 5 - ${ratingMessages[rating - 1]}`;
    feedbackStatus.textContent = "";
  }

  ratingButtons.forEach((button) => {
    button.addEventListener("click", () => selectRating(Number(button.dataset.rating)));
  });

  feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!ratingInput.value) {
      feedbackStatus.textContent = "Please choose a star rating before sending your review.";
      ratingButtons[0].focus();
      return;
    }

    const formData = new FormData(feedbackForm);
    const rating = Number(formData.get("rating"));
    const name = String(formData.get("name") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const submitButton = feedbackForm.querySelector(".feedback-submit");

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    feedbackStatus.textContent = "";

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
        method: "POST",
        headers: {
          ...supabaseHeaders,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          rating,
          name: name || null,
          message: message || null,
        }),
      });

      if (!response.ok) throw new Error("Unable to submit feedback");

      feedbackForm.reset();
      ratingInput.value = "";
      ratingButtons.forEach((button) => {
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
      });
      ratingLabel.textContent = "Select your rating";
      feedbackStatus.textContent = "Thank you. Your review was saved and will appear after approval.";
    } catch (error) {
      feedbackStatus.textContent = "We could not save your review. Please try again.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send review";
    }
  });
}

loadRecentFeedback();
