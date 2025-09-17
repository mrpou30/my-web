const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyFWda891ZdRAlytI_ngKxbilIjw3SA-2eXRyC-_4nTasMopHDzG3ipli_BkOvHYj0p/exec"; // <- pakai URL /exec dari deployment Web App

    const form = document.getElementById("salesForm");
    const salesInput = document.getElementById("sales");
    const tanggalInput = document.getElementById("tanggal");
    const statusEl = document.getElementById("status");
    const toast = document.getElementById("toast");
    const btn = document.getElementById("btnSubmit");

    // Set default tanggal = hari ini
    (function setToday() {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      tanggalInput.value = `${yyyy}-${mm}-${dd}`;
    })();

    // Format input sales ke Rupiah on-the-fly
    salesInput.addEventListener("input", function () {
      const digits = this.value.replace(/[^\d]/g, "");
      this.value = digits ? formatRupiah(digits, "Rp ") : "";
    });

    function formatRupiah(angka, prefix = "Rp ") {
      const s = angka.replace(/[^,\d]/g, "");
      const split = s.split(",");
      const sisa = split[0].length % 3;
      let rupiah = split[0].substr(0, sisa);
      const ribuan = split[0].substr(sisa).match(/\d{3}/gi);
      if (ribuan) {
        const separator = sisa ? "." : "";
        rupiah += separator + ribuan.join(".");
      }
      rupiah = split[1] !== undefined ? rupiah + "," + split[1] : rupiah;
      return prefix + rupiah;
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      statusEl.textContent = "";

      // Build tanggal: yyyy/MM/dd HH:mm:ss (date dari picker + waktu saat submit)
      const [y, m, d] = tanggalInput.value.split("-");
      const now = new Date();
      const HH = String(now.getHours()).padStart(2, "0");
      const MM = String(now.getMinutes()).padStart(2, "0");
      const SS = String(now.getSeconds()).padStart(2, "0");
      const tanggalLengkap = `${y}/${m}/${d} ${HH}:${MM}:${SS}`;

      // Ambil sales angka murni
      const salesClean = salesInput.value.replace(/[^\d]/g, "");
      const sales = parseFloat(salesClean || "0");
      if (!sales || !tanggalInput.value) {
        showToast("⚠️ Lengkapi tanggal & sales.", "warn");
        return;
      }

      // Disable tombol saat kirim
      btn.disabled = true;
      btn.textContent = "Menyimpan Data...";

      try {
        // PENTING: jangan set Content-Type -> biar simple CORS (tidak preflight)
        const res = await fetch(WEB_APP_URL + "?t=" + Date.now(), {
          method: "POST",
          body: JSON.stringify({ tanggal: tanggalLengkap, sales: sales })
        });

        // Kalau server diblok CORS, fetch akan throw sebelum sampai sini.
        const result = await res.json();

        if (result.result === "success") {
          statusEl.textContent = "Data berhasil disimpan.";
          showToast("Data berhasil disimpan!");
          animasiUang();
          form.reset();
          setToday(); // set lagi tanggal = hari ini
        } else {
          statusEl.textContent = "❌ Gagal menyimpan data.";
          showToast("❌ Gagal menyimpan data.", "error");
        }
      }  finally {
        btn.disabled = false;
        btn.textContent = "Simpan";
      }
    });

    // Animasi uang jatuh
    function animasiUang() {
      for (let i = 0; i < 24; i++) {
        const money = document.createElement("div");
        money.classList.add("money");
        money.textContent = Math.random() < 0.5 ? "💵" : "🪙";
        money.style.left = Math.random() * window.innerWidth + "px";
        money.style.animationDuration = (Math.random() * 2.5 + 2.2) + "s";
        document.body.appendChild(money);
        setTimeout(() => money.remove(), 5000);
      }
    }

    // Toast helper
    function showToast(message, type = "success") {
      toast.className = "toast"; // reset
      if (type === "error") toast.classList.add("error");
      if (type === "warn") toast.classList.add("warn");
      toast.textContent = message;
      requestAnimationFrame(() => toast.classList.add("show"));
      setTimeout(() => toast.classList.remove("show"), 3000);
    }