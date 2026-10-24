/**
 * gift.js — amplop digital: tab QRIS / Transfer Bank, salin nomor rekening, unduh QRIS.
 */
(function (global) {
  "use strict";

  const U = (global.Undangan = global.Undangan || {});

  /** Salin ke clipboard; fallback execCommand untuk konteks non-HTTPS / browser lama. */
  async function copyText(text) {
    try {
      if (global.navigator.clipboard && global.isSecureContext) {
        await global.navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      /* lanjut ke fallback */
    }
    const area = U.h("textarea", { readonly: true, "aria-hidden": "true", tabindex: "-1" });
    area.value = text;
    area.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
    document.body.append(area);
    area.select();
    area.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (_) {
      ok = false;
    }
    area.remove();
    return ok;
  }
  U.copyText = copyText;

  function renderQris(panel, qris) {
    const tile = U.h("div", { class: "qris__tile" });
    const img = U.h("img", {
      src: qris.image,
      alt: qris.alt || "Kode QRIS",
      width: 600,
      height: 600,
      loading: "lazy",
      decoding: "async",
    });
    tile.append(img);

    const ext = ((qris.image.match(/\.(png|jpe?g|webp|svg)(?:[?#]|$)/i) || [])[1] || "png").toLowerCase();
    const download = U.h("a", { class: "btn btn--sm", href: qris.image, download: `QRIS-pernikahan.${ext}` }, U.icon("download"), "Unduh QRIS");

    img.addEventListener("error", () => {
      tile.replaceChildren(U.h("p", { class: "qris__empty", style: "color:#333", text: "Gambar QRIS belum tersedia." }));
      download.hidden = true;
    });

    panel.append(
      U.h(
        "div",
        { class: "qris glass" },
        tile,
        U.h("p", { class: "qris__note", text: "Pindai dengan aplikasi bank atau e-wallet Anda." }),
        download
      )
    );
  }

  function renderBanks(panel, banks) {
    const grid = U.h("div", { class: "banks" });
    banks.forEach((entry) => {
      const labelNode = U.h("span", { text: "Salin nomor" });
      let iconNode = U.icon("copy");
      const button = U.h(
        "button",
        { class: "btn btn--quiet", type: "button", "aria-label": `Salin nomor rekening ${entry.bank}` },
        iconNode,
        labelNode
      );

      button.addEventListener("click", async () => {
        const ok = await copyText(entry.number.replace(/\s+/g, ""));
        if (!ok) {
          U.toast("Tidak bisa menyalin otomatis. Tekan lama nomor rekening untuk menyalin.", 4200);
          return;
        }
        U.toast(`Nomor rekening ${entry.bank} disalin`);
        const doneIcon = U.icon("check");
        iconNode.replaceWith(doneIcon);
        const previous = iconNode;
        iconNode = doneIcon;
        labelNode.textContent = "Tersalin";
        setTimeout(() => {
          iconNode.replaceWith(previous);
          iconNode = previous;
          labelNode.textContent = "Salin nomor";
        }, 2000);
      });

      grid.append(
        U.h(
          "article",
          { class: "bank glass" },
          U.h("p", { class: "bank__name", text: entry.bank }),
          U.h("p", { class: "bank__number", text: entry.number }),
          U.h("p", { class: "bank__holder" }, "a.n. ", U.h("strong", { text: entry.holder })),
          button
        )
      );
    });
    panel.append(grid);
  }

  U.initGift = function (cfg) {
    const gift = cfg.gift || {};
    const qris = gift.qris && gift.qris.image ? gift.qris : null;
    const banks = (gift.banks || []).filter((b) => {
      const ok = b && b.bank && b.number && b.holder;
      if (!ok) console.warn("[undangan] Data rekening tidak lengkap, dilewati:", b);
      return ok;
    });

    const tabs = U.$("#gift-tabs");
    const tabEls = { qris: U.$("#tab-qris"), bank: U.$("#tab-bank") };
    const panels = { qris: U.$("#panel-qris"), bank: U.$("#panel-bank") };
    if (!tabs) return;

    if (qris) renderQris(panels.qris, qris);
    if (banks.length) renderBanks(panels.bank, banks);

    const available = [];
    if (qris) available.push("qris");
    if (banks.length) available.push("bank");

    // Empty state: tidak ada metode yang dikonfigurasi
    if (!available.length) {
      tabs.hidden = true;
      panels.qris.hidden = true;
      panels.bank.hidden = false;
      panels.bank.append(U.h("p", { class: "qris__empty", text: "Informasi amplop digital akan segera diumumkan." }));
      return;
    }

    // Hanya satu metode: tidak perlu tab
    if (available.length === 1) {
      tabs.hidden = true;
      Object.keys(panels).forEach((key) => (panels[key].hidden = key !== available[0]));
      return;
    }

    const order = ["qris", "bank"];
    const select = (key, { focus = false } = {}) => {
      order.forEach((k) => {
        const selected = k === key;
        tabEls[k].setAttribute("aria-selected", String(selected));
        tabEls[k].tabIndex = selected ? 0 : -1;
        panels[k].hidden = !selected;
      });
      tabs.style.setProperty("--tab", order.indexOf(key));
      if (focus) tabEls[key].focus();
    };

    order.forEach((key) => tabEls[key].addEventListener("click", () => select(key)));
    tabs.addEventListener("keydown", (event) => {
      const current = order.findIndex((k) => tabEls[k].getAttribute("aria-selected") === "true");
      let next = -1;
      if (event.key === "ArrowRight") next = (current + 1) % order.length;
      else if (event.key === "ArrowLeft") next = (current - 1 + order.length) % order.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = order.length - 1;
      if (next < 0) return;
      event.preventDefault();
      select(order[next], { focus: true });
    });

    select("qris");
  };
})(window);
