import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateShipment } from "@/lib/hooks";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { shipmentsApi } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  Package,
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  Truck,
  FileText,
  Boxes,
  Sparkles,
  User,
} from "lucide-react";

const STEPS = [
  { id: 0, label: "Package Information", icon: Package },
  { id: 1, label: "Sender Information", icon: User },
  { id: 2, label: "Receiver Information", icon: MapPin },
  { id: 3, label: "Shipment Information", icon: Truck },
];

const PACKAGE_TYPES = [
  { value: "BOX", label: "Box" },
  { value: "DOCUMENT", label: "Document" },
  { value: "PARCEL", label: "Parcel" },
  { value: "PALLET", label: "Pallet" },
  { value: "CRATE", label: "Crate" },
];

const SHIPMENT_TYPES = [
  { value: "STANDARD", label: "Standard", baseCost: 200 },
  { value: "EXPRESS", label: "Express", baseCost: 350 },
  { value: "SAME_DAY", label: "Same Day", baseCost: 500 },
  { value: "OVERNIGHT", label: "Overnight", baseCost: 450 },
];

const PRIORITIES = [
  { value: "LOW", label: "Low", multiplier: 1 },
  { value: "NORMAL", label: "Normal", multiplier: 1.2 },
  { value: "HIGH", label: "High", multiplier: 1.5 },
  { value: "URGENT", label: "Urgent", multiplier: 2 },
];

export function CreateShipmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createShipment = useCreateShipment();
  const [step, setStep] = useState(0);
  const [hubs, setHubs] = useState([]);

  useEffect(() => {
    const loadHubs = async () => {
      try {
        const data = await shipmentsApi.getHubs();
        setHubs(data);
      } catch (err) {
        console.error("Failed to load hubs", err);
      }
    };

    loadHubs();
  }, []);
  useEffect(() => {
   
  }, [hubs]);

  // Pre-fill sender from user – fixed line
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  const defaultSenderName = user?.companyName ?? user?.company ?? fullName;
  const defaultSenderPhone = user?.phone ?? "";
  const defaultSenderEmail = user?.email ?? "";

  const [form, setForm] = useState({
    // Package
    packageDescription: "",
    packageType: "BOX",
    packageWeightKg: "",
    pieces: "",
    declaredValue: "",
    fragile: false,
    insured: false,

    // Sender
    senderName: defaultSenderName,
    senderPhone: defaultSenderPhone,
    senderEmail: defaultSenderEmail,
    senderAddress: "",
    senderCity: "",
    senderState: "",
    senderPostalCode: "",
    senderCountry: "INDIA",

    // Receiver
    receiverName: "",
    receiverPhone: "",
    receiverEmail: "",
    receiverAddress: "",
    receiverCity: "",
    receiverState: "",
    receiverPostalCode: "",
    receiverCountry: "INDIA",

    // Shipment
    shipmentType: "STANDARD",
    priority: "NORMAL",
    estimatedDeliveryAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  });

  const selectedShipmentType = SHIPMENT_TYPES.find(
    (s) => s.value === form.shipmentType
  );
  const selectedPriority = PRIORITIES.find(
    (p) => p.value === form.priority
  );

  const estimatedCost = Math.round(
    (selectedShipmentType?.baseCost ?? 0) *
(selectedPriority?.multiplier ?? 1)*
      Math.max(form.packageWeightKg / 10, 1),
  );

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    if (step === 0) {
      return (
        form.packageDescription.trim() !== "" &&
        form.packageWeightKg > 0 &&
        form.pieces > 0
      );
    }
    if (step === 1) {
      return (
        form.senderName.trim() !== "" &&
        form.senderPhone.trim() !== "" &&
        form.senderAddress.trim() !== ""
      );
    }
    if (step === 2) {
      return (
        form.receiverName.trim() !== "" &&
        form.receiverPhone.trim() !== "" &&
        form.receiverAddress.trim() !== ""
      );
    }
    if (step === 3) {
      return form.shipmentType && form.priority;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }
    if (!form.declaredValue || Number(form.declaredValue) <= 0) {
      toast.error("Declared value must be greater than zero.");
      return;
    }

    const payload = {
      customerId: user.id,

      senderName: form.senderName,
      senderPhone: form.senderPhone,
      senderEmail: form.senderEmail,
      senderAddress: form.senderAddress,
      senderCity: form.senderCity,
      senderState: form.senderState,
      senderPostalCode: form.senderPostalCode,
      senderCountry: form.senderCountry,

      receiverName: form.receiverName,
      receiverPhone: form.receiverPhone,
      receiverEmail: form.receiverEmail,
      receiverAddress: form.receiverAddress,
      receiverCity: form.receiverCity,
      receiverState: form.receiverState,
      receiverPostalCode: form.receiverPostalCode,
      receiverCountry: form.receiverCountry,

      packageType: form.packageType,
      packageDescription: form.packageDescription,
      packageWeightKg: form.packageWeightKg,
      declaredValue: form.declaredValue,
      fragile: form.fragile,
      insured: form.insured,
      codAmount: 0,

      shipmentType: form.shipmentType,
      priority: form.priority,
      estimatedDeliveryAt: new Date(
        `${form.estimatedDeliveryAt}T00:00:00`,
      ).toISOString(),
    };

   try {
     await createShipment.mutateAsync(payload);

     toast.success("Shipment created successfully", {
       description: `Cost: ${formatCurrency(estimatedCost)} · ${selectedShipmentType?.label}`,
     });

     navigate("/app/shipments");
   } catch (error) {
     toast.error(error?.response?.data?.message || "Invalid user.");
   }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Create Shipment"
        description="Book a new consignment for domestic or express delivery"
        icon={Package}
      />

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon;
          const isDone = step > s.id;
          const isCurrent = step === s.id;
          return (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                    isDone && "bg-success text-white",
                    isCurrent && "gradient-brand text-white",
                    !isDone && !isCurrent && "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      isCurrent ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    Step {s.id + 1}
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      isCurrent ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-0.5 flex-1 rounded-full",
                    isDone ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {/* Step 0: Package Information */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold">Package Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Tell us about the package you're shipping
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageDescription">
                    Package Description
                  </Label>
                  <Textarea
                    id="packageDescription"
                    value={form.packageDescription}
                    onChange={(e) =>
                      update("packageDescription", e.target.value)
                    }
                    placeholder="e.g. Electronics, documents, etc."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageType">Package Type</Label>
                  <Select
                    value={form.packageType}
                    onValueChange={(v) => update("packageType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKAGE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="packageWeightKg">Weight (kg)</Label>
                    <Input
                      id="packageWeightKg"
                      type="number"
                      value={form.packageWeightKg}
                      onChange={(e) =>
                        update("packageWeightKg", Number(e.target.value))
                      }
                      min={0.1}
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pieces">Pieces</Label>
                    <Input
                      id="pieces"
                      type="number"
                      value={form.pieces}
                      onChange={(e) => update("pieces", Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="declaredValue">Declared Value (₹)</Label>
                    <Input
                      id="declaredValue"
                      type="number"
                      value={form.declaredValue}
                      onChange={(e) =>
                        update("declaredValue", Number(e.target.value))
                      }
                      min={1}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                  {/* <div className="flex items-center gap-3">
                    <Switch
                      id="fragile"
                      checked={form.fragile}
                      onCheckedChange={(checked) => update("fragile", checked)}
                    />
                    <Label htmlFor="fragile" className="font-normal">
                      Fragile
                    </Label>
                  </div> */}
                  {/* <div className="flex items-center gap-3">
                    <Switch
                      id="insured"
                      checked={form.insured}
                      onCheckedChange={(checked) => update("insured", checked)}
                    />
                    <Label htmlFor="insured" className="font-normal">
                      Insured
                    </Label>
                  </div> */}
                </div>
              </div>
            )}

            {/* Step 1: Sender Information */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold">Sender Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Who is sending this package?
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="senderName">Full Name</Label>
                    <Input
                      id="senderName"
                      value={form.senderName}
                      onChange={(e) =>
                        update("senderName", e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senderPhone">Phone</Label>
                    <Input
                      id="senderPhone"
                      value={form.senderPhone}
                      onChange={(e) => update("senderPhone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={form.senderEmail}
                    onChange={(e) => update("senderEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderAddress">Address</Label>
                  <Input
                    id="senderAddress"
                    value={form.senderAddress}
                    onChange={(e) => update("senderAddress", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="senderCity">City</Label>
                    <Select
                      value={form.senderCity}
                      onValueChange={(value) => {
                        const hub = hubs.find((h) => h.city === value);

                        update("senderCity", hub.city);
                        update("senderState", hub.state);
                        update("senderPostalCode", hub.pincode);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>

                      <SelectContent>
                        {hubs.map((hub) => (
                          <SelectItem key={hub.id} value={hub.city}>
                            {hub.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senderState">State</Label>
                    <Input
                      id="senderState"
                      value={form.senderState}
                      onChange={(e) => update("senderState", e.target.value)}
                      disabled
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="senderPostalCode">Postal Code</Label>
                    <Input
                      id="senderPostalCode"
                      value={form.senderPostalCode}
                      onChange={(e) =>
                        update("senderPostalCode", e.target.value)
                      }
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senderCountry">Country</Label>
                    <Input
                      id="senderCountry"
                      value={form.senderCountry}
                      onChange={(e) => update("senderCountry", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Receiver Information */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold">
                    Receiver Information
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Who is receiving this package?
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="receiverName">Full Name</Label>
                    <Input
                      id="receiverName"
                      value={form.receiverName}
                      onChange={(e) =>
                        update("receiverName", e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receiverPhone">Phone</Label>
                    <Input
                      id="receiverPhone"
                      value={form.receiverPhone}
                      onChange={(e) => update("receiverPhone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiverEmail">Email</Label>
                  <Input
                    id="receiverEmail"
                    type="email"
                    value={form.receiverEmail}
                    onChange={(e) => update("receiverEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiverAddress">Address</Label>
                  <Input
                    id="receiverAddress"
                    value={form.receiverAddress}
                    onChange={(e) => update("receiverAddress", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="senderCity">City</Label>
                    <Select
                      value={form.receiverCity}
                      onValueChange={(value) => {
                        const hub = hubs.find((h) => h.city === value);

                        update("receiverCity", hub.city);
                        update("receiverState", hub.state);
                        update("receiverPostalCode", hub.pincode);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>

                      <SelectContent>
                        {hubs.map((hub) => (
                          <SelectItem key={hub.id} value={hub.city}>
                            {hub.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receiverState">State</Label>
                    <Input
                      id="receiverState"
                      value={form.receiverState}
                      onChange={(e) => update("receiverState", e.target.value)}
                      disabled
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="receiverPostalCode">Postal Code</Label>
                    <Input
                      id="receiverPostalCode"
                      value={form.receiverPostalCode}
                      onChange={(e) =>
                        update("receiverPostalCode", e.target.value)
                      }
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receiverCountry">Country</Label>
                    <Input
                      id="receiverCountry"
                      value={form.receiverCountry}
                      onChange={(e) =>
                        update("receiverCountry", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Shipment Information + Review */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold">
                    Shipment Information
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose service type, priority, and delivery date
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shipmentType">Shipment Type</Label>
                    <Select
                      value={form.shipmentType}
                      onValueChange={(v) => update("shipmentType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIPMENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(v) => update("priority", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                 
                </div>

                {/* Review Card */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Review Your Shipment
                  </h4>
                  <div className="space-y-3">
                    <ReviewRow
                      label="Package"
                      value={form.packageDescription || "—"}
                    />
                    <ReviewRow label="Sender" value={form.senderName} />
                    <ReviewRow label="Receiver" value={form.receiverName} />
                    <ReviewRow
                      label="Shipment Type"
                      value={selectedShipmentType?.label}
                    />
                    <ReviewRow
                      label="Priority"
                      value={selectedPriority?.label}
                    />
                    
                    <ReviewRow
                      label="Declared Value"
                      value={formatCurrency(form.declaredValue)}
                    />
                    <ReviewRow
                      label="Weight"
                      value={`${form.packageWeightKg} kg`}
                    />
                    <ReviewRow label="Pieces" value={String(form.pieces)} />
                    {/* <ReviewRow
                      label="Fragile"
                      value={form.fragile ? "Yes" : "No"}
                    />
                    <ReviewRow
                      label="Insured"
                      value={form.insured ? "Yes" : "No"}
                    /> */}
                  </div>
                  <div className="rounded-xl border border-success/30 bg-success/5 p-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold text-success">
                        <Sparkles className="h-4 w-4" />
                        Estimated Cost
                      </span>
                      <span className="text-2xl font-bold text-success">
                        {formatCurrency(estimatedCost)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Final cost calculated after booking confirmation
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
              {step < 3 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                >
                  Continue
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createShipment.isPending || !canProceed()}
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  {createShipment.isPending ? "Creating..." : "Confirm & Book"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Summary */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                Shipment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Sender" value={form.senderName || "—"} />
              <SummaryRow label="Receiver" value={form.receiverName || "—"} />
              <SummaryRow
                label="Package Type"
                value={
                  PACKAGE_TYPES.find((t) => t.value === form.packageType)
                    ?.label || "—"
                }
              />
              <SummaryRow label="Weight" value={`${form.packageWeightKg} kg`} />
              <SummaryRow
                label="Declared Value"
                value={formatCurrency(form.declaredValue)}
              />
              <SummaryRow
                label="Shipment Type"
                value={selectedShipmentType?.label || "—"}
              />
              <SummaryRow
                label="Priority"
                value={selectedPriority?.label || "—"}
              />
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Est. Cost
                  </span>
                  <span className="text-xl font-bold text-success">
                    {formatCurrency(estimatedCost)}
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Boxes className="h-3.5 w-3.5" />
                  Step {step + 1} of {STEPS.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}