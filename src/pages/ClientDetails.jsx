const handlePaySubmit = async (e) => {
  e.preventDefault();
  setPayError("");
  setPaySuccess(false);

  // Vérification de sécurité : on s'assure que le montant est saisi
  if (!payForm.amount || isNaN(payForm.amount)) {
    setPayError("Veuillez saisir un montant valide.");
    return;
  }

  setPaySaving(true);

  try {
    if (payForm.payment_method === 'cinetpay') {
      // 1. Préparation des données pour CinetPay
      // On s'assure d'envoyer des valeurs par défaut si client n'est pas encore chargé
      const payload = {
        amount:         Number(payForm.amount),
        client_id:      id, // l'ID du client provenant de useParams()
        type:           payForm.type || "mensualite",
        description:    `Paiement ${payForm.type} - ${client?.name || 'Client'}`,
        client_name:    client?.name || "Membre Awoundjo",
        client_email:   client?.email || "contact@awoundjo.ci",
        client_phone:   client?.phone || ""
      };

      console.log("Envoi du paiement CinetPay:", payload);

      // 2. Appel au backend Railway
      // Note: Utilise bien ton instance axios 'clientAPI' ou 'api'
      const response = await clientAPI.post('/payments/cinetpay/init-web', payload);

      // 3. Redirection si l'URL est reçue
      if (response.data?.data?.payment_url) {
        window.location.href = response.data.data.payment_url;
      } else {
        throw new Error("Le serveur n'a pas renvoyé d'URL de paiement.");
      }

    } else {
      // Logique pour le CASH (inchangée)
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