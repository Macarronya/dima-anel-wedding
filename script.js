(() => {
  "use strict";

  const config = window.WEDDING_CONFIG;

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element && value) element.textContent = value;
  };

  const setConfigContent = () => {
    setText("partnerOne", config.partnerOne);
    setText("partnerTwo", config.partnerTwo);
    setText("footerPartnerOne", config.partnerOne);
    setText("footerPartnerTwo", config.partnerTwo);
    setText("heroDate", config.heroDate);
    setText("eventDateLong", config.eventDateLong);
    setText("eventTime", config.eventTime);
    setText("eventPlace", config.eventPlace);
    setText("eventAddress", config.eventAddress);
    setText("introTitle", config.introTitle);
    setText("introText", config.introText);

    const heroImage = document.getElementById("heroImage");
    if (heroImage && config.heroImage) heroImage.src = config.heroImage;

    const mapLink = document.getElementById("mapLink");
    if (mapLink && config.mapLink) mapLink.href = config.mapLink;
  };

  const renderAlcoholOptions = () => {
    const container = document.getElementById("alcoholOptions");
    if (!container) return;

    container.innerHTML = "";
    config.alcoholOptions.forEach((option) => {
      const label = document.createElement("label");
      label.className = "choice";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "alcohol";
      input.value = option;

     const content = document.createElement("span");
content.className = "choice__content";

const title = document.createElement("span");
title.textContent = option;

content.append(title);

if (option === "Не буду пить - у меня депрессия") {
  const note = document.createElement("small");
  note.className = "choice__note";
  note.textContent = "Для вас мы возьмём безалкогольное пиво";
  content.append(note);
}

label.append(input, content);
container.append(label);
    });
  };

  const updateCountdown = () => {
    const target = new Date(config.eventDateISO).getTime();
    const now = Date.now();
    const distance = Math.max(target - now, 0);

    const days = Math.floor(distance / 86400000);
    const hours = Math.floor((distance % 86400000) / 3600000);
    const minutes = Math.floor((distance % 3600000) / 60000);
    const seconds = Math.floor((distance % 60000) / 1000);

    setText("days", String(days).padStart(2, "0"));
    setText("hours", String(hours).padStart(2, "0"));
    setText("minutes", String(minutes).padStart(2, "0"));
    setText("seconds", String(seconds).padStart(2, "0"));
  };

  const toggleAlcohol = () => {
    const selected = document.querySelector('input[name="attendance"]:checked');
    const group = document.getElementById("alcoholGroup");
    if (!group) return;

    const unavailable = selected?.value === "К сожалению, не смогу";
    group.hidden = unavailable;

    group.querySelectorAll("input").forEach((input) => {
      input.disabled = unavailable;
      if (unavailable) input.checked = false;
    });
  };

  const collectPayload = (form) => {
    const data = new FormData(form);
    return {
      submittedAt: new Date().toISOString(),
      guestName: String(data.get("guestName") || "").trim(),
      attendance: String(data.get("attendance") || ""),
      alcohol: data.getAll("alcohol"),
      comment: String(data.get("comment") || "").trim(),
      userAgent: navigator.userAgent
    };
  };

  const saveDemoResponse = (payload) => {
    const key = "wedding_rsvp_demo_responses";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.push(payload);
    localStorage.setItem(key, JSON.stringify(current));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const status = document.getElementById("formStatus");
    const button = form.querySelector('button[type="submit"]');
    const payload = collectPayload(form);

    button.disabled = true;
    status.textContent = "Отправляем ответ…";

    try {
      if (config.googleScriptUrl) {
        await fetch(config.googleScriptUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });
        status.textContent = "Спасибо! Ваш ответ отправлен.";
      } else {
        saveDemoResponse(payload);
        status.textContent = "Демо-режим: ответ сохранён в этом браузере. Подключение Google Таблицы пока не настроено.";
      }

      form.reset();
      toggleAlcohol();
    } catch (error) {
      console.error(error);
      status.textContent = "Не удалось отправить ответ. Попробуйте ещё раз или свяжитесь с организаторами.";
    } finally {
      button.disabled = false;
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    setConfigContent();
    renderAlcoholOptions();
    updateCountdown();
    setInterval(updateCountdown, 1000);

    document.querySelectorAll('input[name="attendance"]').forEach((input) => {
      input.addEventListener("change", toggleAlcohol);
    });

    document.getElementById("rsvpForm")?.addEventListener("submit", submitForm);
  });
})();
