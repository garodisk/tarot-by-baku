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
const feedbackSummary = document.querySelector("[data-feedback-summary]");
const supabaseUrl = "https://nsnpnmouhjvvmgmlkgos.supabase.co";
const supabaseKey = "sb_publishable_pVSY7SB7CK5rBcov82gxmg_5ONLUXG7";
const supabaseHeaders = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
};
const publishedFeedbackFilter = "or=(approved.eq.true,message.not.is.null)";

const starterReviews = [
  {
    rating: 5,
    name: "Aakriti",
    message:
      "Baku Bagla's guidance helped me find clarity in my career direction. Highly recommended for anyone feeling stuck professionally.",
    created_at: "2026-07-30T00:00:00.000Z",
  },
  {
    rating: 5,
    name: "Saket",
    message: "Baku's reading was really helpful and gave me clarity in my relationship situation.",
    created_at: "2026-07-30T00:00:00.000Z",
  },
];

function renderReviews(reviews) {
  feedbackList.replaceChildren();

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
}

function getValidRatings(reviews) {
  return reviews
    .map((review) => Number(review.rating))
    .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
}

function renderRatingSummary(reviews, isFallback = false) {
  if (!feedbackSummary) return;

  const ratings = getValidRatings(reviews);
  const averageNode = feedbackSummary.querySelector("[data-feedback-average]");
  const countNode = feedbackSummary.querySelector("[data-feedback-count]");
  const starsNode = feedbackSummary.querySelector("[data-feedback-stars]");

  if (!ratings.length) {
    averageNode.textContent = "0.0";
    countNode.textContent = "No published ratings yet";
    starsNode.textContent = "\u2606\u2606\u2606\u2606\u2606";
    feedbackSummary.setAttribute("aria-label", "No published ratings yet");
    return;
  }

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const roundedStars = Math.max(0, Math.min(5, Math.round(average)));
  const reviewLabel = ratings.length === 1 ? "review" : "reviews";
  const sourceLabel = isFallback ? "featured" : "published";

  averageNode.textContent = average.toFixed(1);
  countNode.textContent = `Average from ${ratings.length} ${sourceLabel} ${reviewLabel}`;
  starsNode.textContent = "\u2605".repeat(roundedStars) + "\u2606".repeat(5 - roundedStars);
  feedbackSummary.setAttribute(
    "aria-label",
    `${average.toFixed(1)} out of 5 average rating from ${ratings.length} ${sourceLabel} ${reviewLabel}`
  );
}

async function loadRecentFeedback() {
  if (!feedbackList && !feedbackSummary) return;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/feedback?select=rating,name,message,created_at&${publishedFeedbackFilter}&order=created_at.desc`,
      { headers: supabaseHeaders }
    );

    if (!response.ok) throw new Error("Unable to load feedback");

    const reviews = await response.json();
    const summaryReviews = reviews.length ? reviews : starterReviews;

    if (feedbackList) renderReviews([...reviews, ...starterReviews]);
    renderRatingSummary(summaryReviews, !reviews.length);
  } catch (error) {
    if (feedbackList) renderReviews(starterReviews);
    renderRatingSummary(starterReviews, true);
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
      const payload = {
        rating,
        name: name || null,
        message: message || null,
      };
      const response = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
        method: "POST",
        headers: {
          ...supabaseHeaders,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ ...payload, approved: Boolean(message) }),
      });

      if (!response.ok) {
        const fallbackResponse = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
          method: "POST",
          headers: {
            ...supabaseHeaders,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(payload),
        });

        if (!fallbackResponse.ok) throw new Error("Unable to submit feedback");
      }

      feedbackForm.reset();
      ratingInput.value = "";
      ratingButtons.forEach((button) => {
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
      });
      ratingLabel.textContent = "Select your rating";
      feedbackStatus.textContent = message
        ? "Thank you. Your written review was saved and will appear on the website."
        : "Thank you. Your rating was saved and will appear after approval.";
    } catch (error) {
      feedbackStatus.textContent = "We could not save your review. Please try again.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send review";
    }
  });
}

loadRecentFeedback();
