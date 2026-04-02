const handlePaySubmit = async (e) => {
  e.preventDefault();
  setPayError("");
  setPaySuccess(false);

  if (!payForm.amount || isNaN(payForm.amount)) {
    setPayError("Veuillez saisir un montant valide.");
    return;
  }

  setPaySaving(true);

  try {
    if (payForm.payment_method === 'cinetpay') {
      const payload = {
        amount:       Number(payForm.amount),
        client_id:    id,
        type:         payForm.type || "mensualite",
        description:  `Paiement ${payForm.type} - ${client?.name || 'Client'}`,
        client_name:  client?.name  || "Membre Awoundjo",
        client_email: client?.email || "contact@awoundjo.ci",
        client_phone: client?.phone || ""
      };

      console.log("Envoi du paiement CinetPay:", payload);

      // Appel direct — évite le baseURL /api/client de clientAPI
      const BASE  = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("token");

      const res  = await fetch(`${BASE}/api/payments/cinetpay/init-web`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      const paymentUrl = data?.data?.payment_url || data?.payment_url || null;

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error(data?.error || "Le serveur n'a pas renvoyé d'URL de paiement.");
      }

    } else {
      // Cash — inchangé
      await paymentsAPI.create({
        ...payForm,
        client_id: id,
        amount: Number(payForm.amount)
      });

      setPaySuccess(true);
      setTimeout(() => {
        handleClosePayModal();
        window.location.reload();
      }, 1500);
    }
  } catch (err) {
    console.error("Erreur détaillée:", err);
    const msg = err.response?.data?.error || err.message || "Erreur de connexion.";
    setPayError(msg);
  } finally {
    setPaySaving(false);
  }
};