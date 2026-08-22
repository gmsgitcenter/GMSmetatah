/**
 * =========================================================
 * GMS METATAH — RSVP API
 * =========================================================
 *
 * Hubungkan file ini dengan Google Apps Script Web App.
 *
 * Contoh:
 *
 * <script src="config.js"></script>
 * <script src="rsvp-api.js"></script>
 * =========================================================
 */

(function () {
  "use strict";

  const config = window.WEDDING_CONFIG || {};

  const API_URL = config.appsScriptUrl || "";


  /**
   * =======================================================
   * CHECK API CONFIGURATION
   * =======================================================
   */
  function checkApi() {

    if (!API_URL) {
      throw new Error(
        "Google Apps Script URL belum dikonfigurasi."
      );
    }

    if (API_URL.includes("PASTE_")) {
      throw new Error(
        "Google Apps Script URL belum diisi."
      );
    }

  }


  /**
   * =======================================================
   * SUBMIT RSVP
   * =======================================================
   *
   * Data:
   *
   * {
   *   name: "Berliana",
   *   attendance: "Attending",
   *   guests: 2,
   *   message: "Congratulations!"
   * }
   *
   * =======================================================
   */
  async function submitRSVP(data) {

    checkApi();

    if (!data.name || !data.name.trim()) {
      throw new Error(
        "Nama wajib diisi."
      );
    }

    if (
      data.attendance !== "Attending" &&
      data.attendance !== "Not Attending"
    ) {
      throw new Error(
        "Silakan pilih konfirmasi kehadiran."
      );
    }

    let guests = Number(data.guests || 0);

    guests = Math.max(
      0,
      Math.min(10, guests)
    );


    const payload = new URLSearchParams();

    payload.append(
      "name",
      data.name.trim()
    );

    payload.append(
      "attendance",
      data.attendance
    );

    payload.append(
      "guests",
      guests
    );

    payload.append(
      "message",
      data.message
        ? data.message.trim()
        : ""
    );


    /*
     * Google Apps Script Web App.
     *
     * no-cors digunakan karena endpoint Apps Script
     * dapat menghasilkan response yang tidak bisa dibaca
     * browser karena CORS.
     */
    await fetch(API_URL, {

      method: "POST",

      mode: "no-cors",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded;charset=UTF-8"
      },

      body: payload.toString()

    });


    return {
      success: true
    };

  }


  /**
   * =======================================================
   * GET WEDDING WISHES
   * =======================================================
   */
  async function getWishes() {

    checkApi();

    const response = await fetch(
      API_URL + "?action=wishes&_=" + Date.now(),
      {
        method: "GET",
        cache: "no-store"
      }
    );


    if (!response.ok) {

      throw new Error(
        "Gagal mengambil wedding wishes."
      );

    }


    const data =
      await response.json();


    if (!Array.isArray(data)) {

      return [];

    }


    return data

      .filter(function (item) {

        return (
          item &&
          item.name &&
          item.message
        );

      })

      .map(function (item) {

        return {

          name: String(
            item.name
          ),

          message: String(
            item.message
          ),

          attendance:
            item.attendance || "",

          guests:
            Number(item.guests || 0),

          timestamp:
            item.timestamp || null

        };

      });

  }


  /**
   * =======================================================
   * GET ONLY LATEST WISHES
   * =======================================================
   */
  async function getLatestWishes(
    limit = 20
  ) {

    const wishes =
      await getWishes();


    return wishes

      .slice()

      .reverse()

      .slice(
        0,
        limit
      );

  }


  /**
   * =======================================================
   * AUTO REFRESH WISHES
   * =======================================================
   *
   * Callback akan dijalankan setiap interval.
   *
   * Contoh:
   *
   * startWishesPolling(
   *   wishes => renderWishes(wishes),
   *   15000
   * );
   *
   */
  function startWishesPolling(
    callback,
    interval = 15000
  ) {

    if (
      typeof callback !== "function"
    ) {

      throw new Error(
        "Callback wishes harus berupa function."
      );

    }


    async function refresh() {

      try {

        const wishes =
          await getLatestWishes();

        callback(
          wishes,
          null
        );

      } catch (error) {

        callback(
          [],
          error
        );

      }

    }


    // Load pertama
    refresh();


    // Refresh berkala
    const timer =
      setInterval(
        refresh,
        interval
      );


    // Return function untuk stop polling
    return function stopPolling() {

      clearInterval(timer);

    };

  }


  /**
   * =======================================================
   * FORM HELPER
   * =======================================================
   *
   * Bisa langsung digunakan:
   *
   * handleRSVPForm(
   *   document.querySelector("#rsvpForm"),
   *   statusElement
   * );
   *
   */
  function handleRSVPForm(
    form,
    statusElement
  ) {

    if (!form) {

      throw new Error(
        "RSVP form tidak ditemukan."
      );

    }


    form.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        if (statusElement) {

          statusElement.textContent =
            "Mengirim RSVP...";

          statusElement.className =
            "form-status loading";

        }


        const formData =
          new FormData(form);


        const data = {

          name:
            formData.get("name"),

          attendance:
            formData.get("attendance"),

          guests:
            formData.get("guests"),

          message:
            formData.get("message")

        };


        try {

          await submitRSVP(data);


          if (statusElement) {

            statusElement.textContent =
              "Terima kasih. RSVP Anda berhasil dikirim ❤️";

            statusElement.className =
              "form-status success";

          }


          form.reset();


          /*
           * Setelah reset, jumlah tamu kembali
           * ke 1 jika field tersedia.
           */
          const guestsInput =
            form.querySelector(
              '[name="guests"]'
            );


          if (guestsInput) {

            guestsInput.value = "1";

          }


          /*
           * Event custom agar bagian
           * wedding wishes bisa refresh.
           */
          window.dispatchEvent(
            new CustomEvent(
              "rsvp:submitted"
            )
          );


        } catch (error) {

          console.error(
            "RSVP Error:",
            error
          );


          if (statusElement) {

            statusElement.textContent =
              error.message ||
              "RSVP gagal dikirim. Silakan coba lagi.";

            statusElement.className =
              "form-status error";

          }

        }

      }
    );

  }


  /**
   * =======================================================
   * ESCAPE HTML
   * =======================================================
   *
   * Digunakan sebelum data wishes dimasukkan
   * ke innerHTML.
   */
  function escapeHTML(value) {

    return String(value)

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      )

      .replace(
        /"/g,
        "&quot;"
      )

      .replace(
        /'/g,
        "&#039;"
      );

  }


  /**
   * =======================================================
   * RENDER WISHES
   * =======================================================
   */
  function renderWishes(
    container,
    wishes
  ) {

    if (!container) {
      return;
    }


    if (
      !wishes ||
      wishes.length === 0
    ) {

      container.innerHTML = `
        <p class="muted">
          Belum ada ucapan.
          Jadilah yang pertama memberikan doa ❤️
        </p>
      `;

      return;

    }


    container.innerHTML =
      wishes.map(function (wish) {

        return `
          <article class="wish">

            <div class="wish-name">
              ${escapeHTML(wish.name)}
            </div>

            <p class="wish-message">
              “${escapeHTML(wish.message)}”
            </p>

          </article>
        `;

      }).join("");

  }


  /**
   * =======================================================
   * PUBLIC API
   * =======================================================
   */
  window.RSVP_API = {

    submitRSVP,

    getWishes,

    getLatestWishes,

    startWishesPolling,

    handleRSVPForm,

    renderWishes,

    escapeHTML

  };

})();
