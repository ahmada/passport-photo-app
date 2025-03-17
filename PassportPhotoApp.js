import React, { useState, useEffect } from "react";
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import CardContent from "./components/ui/CardContent";
import Input from "./components/ui/Input";
import Select from "./components/ui/Select";
import { uploadImage, removeBackground, generatePrintFile, getCountryRequirements, processPayment, trackConversion, getAnalyticsData } from "./lib/photoUtils";

export default function PassportPhotoApp() {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [country, setCountry] = useState("");
  const [photoSize, setPhotoSize] = useState(null);
  const [countries, setCountries] = useState([]);
  const [paperSize, setPaperSize] = useState("A4");
  const [copies, setCopies] = useState(2);
  const [pricingModel, setPricingModel] = useState("flat");
  const [price, setPrice] = useState(4.99);
  const [paymentMethod, setPaymentMethod] = useState("Stripe");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function fetchCountries() {
      const countryList = await getCountryRequirements("list");
      setCountries(countryList);
    }
    fetchCountries();
    experimentWithPricing();
    fetchAnalytics();
  }, []);

  const experimentWithPricing = () => {
    const models = ["flat", "tiered", "country-specific", "freemium"];
    const selectedModel = models[Math.floor(Math.random() * models.length)];
    setPricingModel(selectedModel);

    switch (selectedModel) {
      case "flat":
        setPrice(4.99);
        break;
      case "tiered":
        setPrice(4.99);
        break;
      case "country-specific":
        setPrice(country === "India" || country === "Nigeria" ? 2.99 : 4.99);
        break;
      case "freemium":
        setPrice(3.99);
        break;
      default:
        setPrice(4.99);
    }
  };

  const fetchAnalytics = async () => {
    const data = await getAnalyticsData();
    setAnalytics(data);
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const uploadedImage = await uploadImage(file);
    setImage(uploadedImage);
  };

  const handleProcess = async () => {
    if (!image) return;
    const bgRemovedImage = await removeBackground(image);
    setProcessedImage(bgRemovedImage);
  };

  const handlePayment = async () => {
    const success = await processPayment(price, paymentMethod);
    if (success) {
      trackConversion(pricingModel, price);
      handleDownload();
      fetchAnalytics();
    } else {
      alert("Payment failed. Please try again.");
    }
  };

  const handleDownload = () => {
    if (!processedImage || !photoSize) return;
    generatePrintFile(processedImage, photoSize, paperSize, copies);
  };

  const handleCountryChange = async (event) => {
    const selectedCountry = event.target.value;
    setCountry(selectedCountry);
    const requirements = await getCountryRequirements(selectedCountry);
    setPhotoSize(requirements.photoSize);
    experimentWithPricing();
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Passport & Visa Photo Creator</h2>
          <Select onChange={handleCountryChange}>
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </Select>
          {photoSize && <p>Required Size: {photoSize.width} x {photoSize.height} cm</p>}
          <Input type="file" accept="image/*" onChange={handleUpload} />
          {image && <img src={image} alt="Uploaded" className="max-w-xs" />}
          <Button onClick={handleProcess} disabled={!image}>Remove Background</Button>
          {processedImage && <img src={processedImage} alt="Processed" className="max-w-xs" />}
          <Select onChange={(e) => setPaperSize(e.target.value)}>
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </Select>
          <Input type="number" value={copies} min={1} onChange={(e) => setCopies(e.target.value)} placeholder="Copies per page" />
          <p className="font-bold">Price: ${price} USD (Model: {pricingModel})</p>
          <Select onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="Stripe">Credit Card (Stripe)</option>
            <option value="PayPal">PayPal</option>
            <option value="Razorpay">UPI & Local (India)</option>
            <option value="Flutterwave">Africa Payment (Flutterwave)</option>
          </Select>
          <Button onClick={handlePayment} disabled={!processedImage || !photoSize}>Pay & Download</Button>
        </CardContent>
      </Card>
      {analytics && (
        <Card className="w-full max-w-md mt-6">
          <CardContent>
            <h3 className="text-lg font-bold">Analytics Dashboard</h3>
            <p>Total Visitors: {analytics.visitors}</p>
            <p>Completed Purchases: {analytics.purchases}</p>
            <p>Conversion Rate: {analytics.conversionRate}%</p>
            <p>Most Effective Pricing Model: {analytics.bestModel}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
