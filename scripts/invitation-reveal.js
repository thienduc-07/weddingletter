/**
 * INVITATION REVEAL & CONTENT BINDING CONTROLLER
 * -------------------------------------------------------------
 * Injects dynamic content from wedding-content.js into all semantic
 * elements, handles staged typographic reveals, and manages RSVP.
 */

import { weddingContent } from '../src/data/wedding-content.js';

export class InvitationController {
  constructor() {
    this.initContent();
    this.initRSVP();
  }

  initContent() {
    const c = weddingContent;

    // Couple Names & Initials
    document.querySelectorAll('[data-bind="couple-initials"]').forEach((el) => {
      el.textContent = c.couple.initials || 'M & H';
    });

    document.querySelectorAll('[data-bind="couple-monogram"]').forEach((el) => {
      el.textContent = c.couple.monogram || 'M · H';
    });

    document.querySelectorAll('[data-bind="partner-one"]').forEach((el) => {
      el.textContent = c.couple.partnerOne || 'Minh Anh';
    });

    document.querySelectorAll('[data-bind="partner-two"]').forEach((el) => {
      el.textContent = c.couple.partnerTwo || 'Hoàng Nam';
    });

    // Date & Time
    document.querySelectorAll('[data-bind="wedding-date"]').forEach((el) => {
      el.textContent = c.wedding.date || '20.12.2026';
    });

    document.querySelectorAll('[data-bind="wedding-date-display"]').forEach((el) => {
      el.textContent = c.wedding.dateDisplay || 'Chủ Nhật, 20.12.2026';
    });

    document.querySelectorAll('[data-bind="ceremony-time"]').forEach((el) => {
      el.textContent = c.wedding.ceremonyTime || '15:30';
    });

    // Venue Information
    document.querySelectorAll('[data-bind="venue-name"]').forEach((el) => {
      el.textContent = c.venue.name || 'The Garden Wedding';
    });

    document.querySelectorAll('[data-bind="venue-subname"]').forEach((el) => {
      el.textContent = c.venue.subName || '';
    });

    document.querySelectorAll('[data-bind="venue-address"]').forEach((el) => {
      el.textContent = c.venue.address || '';
    });

    document.querySelectorAll('[data-bind="venue-notes"]').forEach((el) => {
      el.textContent = c.venue.notes || '';
    });

    document.querySelectorAll('[data-bind="venue-dresscode"]').forEach((el) => {
      el.textContent = c.venue.dressCode || '';
    });

    // Map URL Button
    const mapBtn = document.querySelector('[data-bind="map-link"]');
    if (mapBtn) {
      if (c.venue.mapUrl) {
        mapBtn.href = c.venue.mapUrl;
        mapBtn.target = '_blank';
        mapBtn.rel = 'noopener noreferrer';
      } else {
        mapBtn.style.display = 'none';
      }
    }

    // Invitation Copy
    document.querySelectorAll('[data-bind="invitation-eyebrow"]').forEach((el) => {
      el.textContent = c.invitation.eyebrow || 'TRÂN TRỌNG KÍNH MỜI';
    });

    document.querySelectorAll('[data-bind="invitation-heading"]').forEach((el) => {
      el.textContent = c.invitation.heading || 'Lễ Thành Hôn';
    });

    document.querySelectorAll('[data-bind="invitation-message"]').forEach((el) => {
      el.textContent = c.invitation.message || '';
    });

    document.querySelectorAll('[data-bind="invitation-closing"]').forEach((el) => {
      el.textContent = c.invitation.closing || '';
    });

    document.querySelectorAll('[data-bind="quote-text"]').forEach((el) => {
      el.textContent = c.invitation.quote || '';
    });

    document.querySelectorAll('[data-bind="quote-author"]').forEach((el) => {
      el.textContent = c.invitation.quoteAuthor || '';
    });

    // Story Lead & Subtitle
    const storyLead = document.querySelector('[data-bind="story-lead"]');
    if (storyLead && c.story?.lead) {
      storyLead.textContent = c.story.lead;
    }

    // Story Milestones
    const milestonesWrap = document.getElementById('storyMilestones');
    if (milestonesWrap && c.story?.chapters) {
      milestonesWrap.innerHTML = c.story.chapters.map((ch) => `
        <div class="milestone-item">
          <div class="milestone-year">${ch.year}</div>
          <div class="milestone-title">${ch.title}</div>
          <p class="milestone-text">${ch.text}</p>
        </div>
      `).join('');
    }

    // Wedding Timeline Schedule
    const timelineWrap = document.getElementById('weddingTimeline');
    if (timelineWrap && c.wedding?.timeline) {
      timelineWrap.innerHTML = c.wedding.timeline.map((item) => `
        <div class="timeline-card">
          <div class="timeline-time">${item.time}</div>
          <div class="timeline-title">${item.title}</div>
          <div class="timeline-desc">${item.description}</div>
        </div>
      `).join('');
    }

    // Assets / Photos
    const heroBg = document.querySelector('[data-bind-src="hero-image"]');
    if (heroBg && c.assets?.heroImage) {
      heroBg.src = c.assets.heroImage;
    }

    const couplePrimary = document.querySelector('[data-bind-src="couple-photo-primary"]');
    if (couplePrimary && c.assets?.couplePhotoPrimary) {
      couplePrimary.src = c.assets.couplePhotoPrimary;
    }

    const coupleSecondary = document.querySelector('[data-bind-src="couple-photo-secondary"]');
    if (coupleSecondary && c.assets?.couplePhotoSecondary) {
      coupleSecondary.src = c.assets.couplePhotoSecondary;
    }

    // RSVP Section Visibility
    const rsvpSection = document.getElementById('rsvpSection');
    if (rsvpSection && !c.rsvp?.enabled) {
      rsvpSection.style.display = 'none';
      const rsvpHeaderBtn = document.querySelector('.btn-header-rsvp');
      if (rsvpHeaderBtn) rsvpHeaderBtn.style.display = 'none';
    }

    const rsvpDeadline = document.querySelector('[data-bind="rsvp-deadline"]');
    if (rsvpDeadline && c.rsvp?.deadlineText) {
      rsvpDeadline.textContent = c.rsvp.deadlineText;
    }
  }

  triggerTypographyReveal() {
    const card = document.querySelector('.invitation-card');
    if (!card) return;

    const nameElements = card.querySelectorAll('.couple-names .name-part, .card-names .name-part');
    nameElements.forEach((el, idx) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.9, 0.3, 1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 400 + idx * 300);
    });
  }

  initRSVP() {
    const form = document.getElementById('rsvpForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('[name="guest_name"]')?.value?.trim();
      const guests = form.querySelector('[name="guest_count"]')?.value || '1';
      const attendance = form.querySelector('input[name="attending"]:checked')?.value || 'yes';
      const dietary = form.querySelector('[name="dietary"]')?.value || 'none';
      const message = form.querySelector('[name="message"]')?.value?.trim() || '';

      if (!name) {
        alert('Vui lòng nhập họ và tên của bạn.');
        return;
      }

      const statusEl = document.getElementById('rsvpStatus');
      const attendingText = attendance === 'yes' ? 'Sẽ tham dự' : 'Rất tiếc không thể đến';

      // If an external RSVP form is provided, open it
      if (weddingContent.rsvp?.externalUrl) {
        window.open(weddingContent.rsvp.externalUrl, '_blank');
        return;
      }

      // Honest Mailto Handler with Pre-filled details
      const recipient = weddingContent.rsvp?.emailRecipient || 'minhanh.hoangnam2026@gmail.com';
      const subject = encodeURIComponent(`[RSVP Lễ Thành Hôn] ${name} - ${attendingText}`);
      const body = encodeURIComponent(
        `Kính gửi Minh Anh & Hoàng Nam,\n\n` +
        `Tôi: ${name}\n` +
        `Xác nhận: ${attendingText}\n` +
        `Số lượng khách: ${guests}\n` +
        `Chế độ ăn uống: ${dietary}\n` +
        `Lời chúc: ${message || '(Không có)'}\n\n` +
        `Trân trọng!`
      );

      // Trigger mail client
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;

      // Show warm on-screen confirmation
      if (statusEl) {
        statusEl.className = 'rsvp-status-msg is-visible success';
        statusEl.innerHTML = `
          <strong>Cảm ơn ${name}!</strong><br>
          Thông tin phản hồi của bạn đã được ghi nhận (${attendingText}). 
          Chúng tôi rất háo hức được gặp bạn trong ngày trọng đại!
        `;
      }
    });
  }
}
