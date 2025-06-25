 async function shareWithWhatsApp() {
        const userId = localStorage.getItem("userId");
        const apiBase = "http://localhost:3000/user";
        let phoneNumber = "";

        // 1. Fetch emergency contact
        try {
          const res = await fetch(`${apiBase}/${userId}`);
          const user = await res.json();

          // Add your country code here, e.g., "880" for Bangladesh
          const rawNumber = user.emergencyContact || "";
          const cleanedNumber = rawNumber.replace(/\D/g, ""); // remove all non-digit characters
          const countryCode = "880";

          // Add country code if not already included
          if (cleanedNumber.startsWith(countryCode)) {
            phoneNumber = cleanedNumber;
          } else {
            phoneNumber = countryCode + cleanedNumber;
          }
        } catch (err) {
          console.error("Error loading profile", err);
          alert("Could not load emergency contact.");
          return;
        }

        // 2. Get location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              let lat = position.coords.latitude;
              let lng = position.coords.longitude;
              let locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

              let message = `Hey, I'm sharing my location: ${locationLink}`;
              let whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

              window.location.href = whatsappLink; // Open WhatsApp
            },
            () => {
              alert("Please enable location to share!");
            }
          );
        } else {
          alert("Geolocation is not supported by your browser.");
        }
      }