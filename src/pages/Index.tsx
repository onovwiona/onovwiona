import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, GraduationCap, CheckCircle } from "lucide-react";
import { z } from "zod";

const studentSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(100),
  faculty: z.string().trim().min(1, "Faculty is required").max(100),
  department: z.string().trim().min(1, "Department is required").max(100),
  level: z.string().regex(/^\d+$/, "Level must be a number").min(1, "Level is required"),
  mat_number: z.string().trim().min(1, "Mat number is required").max(30),
  phone_number: z.string().trim().min(1, "Phone number is required").max(20),
});

const Index = () => {
  const [form, setForm] = useState({
    full_name: "",
    faculty: "",
    department: "",
    level: "",
    mat_number: "",
    phone_number: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = studentSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    // Use anon insert — RLS allows authenticated insert but we need to handle anon too
    const { error } = await supabase.from("students").insert([{
      full_name: result.data.full_name,
      faculty: result.data.faculty,
      department: result.data.department,
      level: result.data.level,
      mat_number: result.data.mat_number,
      phone_number: result.data.phone_number,
    }]);

    if (error) {
      if (error.code === "23505") {
        toast.error("This mat number is already registered.");
        setErrors({ mat_number: "Already registered" });
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    } else {
      setSubmitted(true);
      toast.success("Information submitted successfully!");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="page-container flex items-center justify-center px-4">
        <div className="form-card max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your information has been recorded successfully.
          </p>
          {/* <Button onClick={() => { setSubmitted(false); setForm({ full_name: "", faculty: "", department: "", level: "", mat_number: "", phone_number: "" }); }}>
            Submit Another
          </Button> */}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4">
            <GraduationCap className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Students That Applied For NELFUND And Has Not Paid School fees</h1>
          <p className="text-muted-foreground">Please fill in your details below</p>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {([
              { key: "full_name", label: "Full Name", placeholder: "Rukevwe Rejoice", type: "text" },
              { key: "faculty", label: "Faculty", placeholder: "FACULTY OF COMPUTING", type: "text" },
              { key: "department", label: "Department", placeholder: "Computer Science", type: "text" },
              { key: "level", label: "Level", placeholder: "100", type: "number" },
              { key: "mat_number", label: "Mat Number", placeholder: "250301-101", type: "text" },
              { key: "phone_number", label: "Phone Number", placeholder: "08108117215", type: "tel" },
            ] as const).map(({ key, label, placeholder, type }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={type}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className={errors[key] ? "border-destructive" : ""}
                />
                {errors[key] && (
                  <p className="text-sm text-destructive">{errors[key]}</p>
                )}
              </div>
            ))}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Information"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Index;
