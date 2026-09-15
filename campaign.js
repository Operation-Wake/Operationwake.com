(function () {
  const campaign = (window.OPERATION_WAKE && window.OPERATION_WAKE.campaign) || {};
  const contributionForm = document.querySelector("[data-contribution-form]");

  if (contributionForm) {
    const fieldset = contributionForm.querySelector("fieldset");
    const statusNode = contributionForm.querySelector(".device-status");
    const recurringInput = contributionForm.querySelector("[data-recurring]");
    const customInput = contributionForm.querySelector("[data-custom-amount]");
    const isLive = campaign.paymentsLive === true && Boolean(campaign.oneTimePaymentLink);

    if (fieldset) fieldset.disabled = !isLive;
    contributionForm.classList.toggle("is-pending", !isLive);

    if (statusNode) {
      statusNode.textContent = isLive
        ? "Secure checkout is live. Stripe processes the payment; Operation Wake never receives your card details."
        : `${campaign.paymentStatus || "Payments opening soon"}. The campaign page is ready, but contributions are not being accepted yet.`;
    }

    contributionForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!isLive) return;

      const wantsRecurring = Boolean(recurringInput && recurringInput.checked);
      const destination = wantsRecurring ? campaign.recurringPaymentLink : campaign.oneTimePaymentLink;
      if (!destination) {
        if (statusNode) statusNode.textContent = "That contribution option is not live yet. Please choose a one-time contribution.";
        return;
      }

      // Stripe's customer-chosen-amount page collects the final amount securely.
      // The amount controls here communicate intent; no card or bank data touches this site.
      const selected = contributionForm.querySelector('input[name="amount"]:checked');
      const amount = customInput && customInput.value ? customInput.value : (selected ? selected.value : "5");
      try {
        const url = new URL(destination);
        url.searchParams.set("client_reference_id", `campaign-${amount}`);
        window.location.assign(url.toString());
      } catch (_) {
        window.location.assign(destination);
      }
    });
  }
})();
