import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SignaturePad from "signature_pad";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  PenLine,
  Package,
} from "lucide-react";

import { useShipment } from "@/lib/hooks";
import { podApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/shared/states";

export default function CustomerPodUploadPage() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const shipment = useShipment(shipmentId);

  const [podImage, setPodImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sigRef = useRef(null);
  const signaturePad = useRef(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPodImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!shipment.data) return;

    if (shipment.data.status?.toUpperCase() !== "DELIVERED") {
      toast.error("POD can only be uploaded for a delivered shipment.");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please enter the recipient name.");
      return;
    }

    if (!podImage) {
      toast.error("Please upload the Proof of Delivery image.");
      return;
    }

    if (!signaturePad.current || signaturePad.current.isEmpty()) {
      toast.error("Please provide your signature.");
      return;
    }

    try {
      setIsSubmitting(true);

      const signature = signaturePad.current.toDataURL();

      const formData = new FormData();

      formData.append(
        "request",
        JSON.stringify({
          shipmentId: Number(shipmentId),
          recipientName: customerName.trim(),
          recipientPhone: customerPhone.trim(),
          signatureUrl: signature,
          deliveryNotes: deliveryNotes.trim(),
        }),
      );

      formData.append("photo", podImage);

      await podApi.create(formData);

      toast.success("Proof of Delivery submitted successfully.");

      if (user?.role === "logistics_operator") {
        navigate("/app/pod");
      } else {
        navigate("/app/customer/dashboard");
      }
    } catch (error) {
      console.error("POD upload failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to submit Proof of Delivery.";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (shipment.isLoading) {
    return <LoadingState label="Loading shipment..." />;
  }

  if (shipment.isError || !shipment.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Shipment not found</p>

          <Button asChild variant="outline" className="mt-4">
            <Link to="/app/customer/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentShipment = shipment.data;

  const st = currentShipment.status?.toUpperCase();
  if (st !== "DELIVERED" && st !== "OUT_FOR_DELIVERY") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />

          <p className="mt-3 font-semibold">Shipment is not ready for POD</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Proof of Delivery can be submitted once the package is out for delivery or delivered.
          </p>

          <Button asChild variant="outline" className="mt-4">
            <Link to="/app/customer/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/customer/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Submit Proof of Delivery
          </CardTitle>

          <CardDescription>
            Upload delivery proof and provide your signature for shipment{" "}
            <span className="font-mono font-semibold">
              {currentShipment.trackingNumber}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* POD IMAGE */}
          <div className="space-y-3">
            <Label>Proof of Delivery Image</Label>

            <input
              id="customer-pod-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            <label htmlFor="customer-pod-upload">
              <Button type="button" asChild variant="outline">
                <span className="cursor-pointer">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {podImage ? "Change Image" : "Upload Image"}
                </span>
              </Button>
            </label>

            {preview && (
              <div className="mt-4 overflow-hidden rounded-xl border">
                <img
                  src={preview}
                  alt="Proof of Delivery preview"
                  className="max-h-[420px] w-full object-contain"
                />
              </div>
            )}
          </div>

          {/* SIGNATURE */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Customer Signature
            </Label>

            <canvas
              ref={(canvas) => {
                if (!canvas) return;

                sigRef.current = canvas;

                if (!signaturePad.current) {
                  signaturePad.current = new SignaturePad(canvas, {
                    penColor: "black",
                    minWidth: 1,
                    maxWidth: 2,
                  });
                }
              }}
              style={{
                width: "100%",
                height: "180px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                background: "#fff",
                touchAction: "none",
              }}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => signaturePad.current?.clear()}
            >
              Clear Signature
            </Button>
          </div>

          {/* RECIPIENT */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Recipient Name</Label>

              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter recipient name"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>

              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Delivery Notes</Label>

            <Input
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Optional delivery notes"
            />
          </div>

          <div className="flex justify-end border-t pt-6">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !customerName.trim() || !podImage}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />

              {isSubmitting ? "Submitting..." : "Submit Proof of Delivery"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
