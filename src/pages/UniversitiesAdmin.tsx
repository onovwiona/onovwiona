import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, FileText, File, Search, LayoutDashboard, FileSpreadsheet,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type University = Tables<"universities">;

const emptyForm = {
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
};

const UniversitiesAdmin = () => {

  const [universities, setUniversities] = useState<University[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");

  const [facultyFilter, setFacultyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [paginate, setPaginate] = useState(false);

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const itemsPerPage = 25;

  const fetchUniversities = async () => {
    const { data, error } = await supabase
      .from("universities")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load universities");
    else setUniversities(data || []);

    setFetching(false);
  };

  useEffect(() => { fetchUniversities(); }, []);

  const faculties = [...new Set(universities.map((u) => u.faculty))];
  const departments = [...new Set(universities.map((u) => u.department))];
  const levels = [...new Set(universities.map((u) => u.level))];
  const programs = [...new Set(universities.map((u) => u.program))];

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (u: University) => {
    setEditingId(u.id);
    setForm({
      matric_number: u.matric_number,
      first_name: u.first_name,
      last_name: u.last_name,
      other_name: u.other_name || "",
      date_of_birth: u.date_of_birth,
      gender: u.gender,
      state_of_origin: u.state_of_origin,
      lga: u.lga,
      level: u.level,
      jamb_number: u.jamb_number,
      nin: u.nin,
      phone_number: u.phone_number,
      email_address: u.email_address,
      program: u.program,
      department: u.department,
      faculty: u.faculty,
      duration_of_course: u.duration_of_course,
      total_fees: u.total_fees,
      academic_session: u.academic_session,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.matric_number || !form.first_name || !form.last_name || !form.date_of_birth ||
        !form.gender || !form.state_of_origin || !form.lga || !form.level || !form.jamb_number ||
        !form.nin || !form.phone_number || !form.email_address || !form.program ||
        !form.department || !form.faculty || !form.duration_of_course || !form.total_fees ||
        !form.academic_session) {
      toast.error("All fields are required");
      return;
    }

    setSubmitting(true);

    if (editingId) {
      const { error } = await supabase
        .from("universities")
        .update({
          matric_number: form.matric_number,
          first_name: form.first_name,
          last_name: form.last_name,
          other_name: form.other_name || null,
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          state_of_origin: form.state_of_origin,
          lga: form.lga,
          level: form.level,
          jamb_number: form.jamb_number,
          nin: form.nin,
          phone_number: form.phone_number,
          email_address: form.email_address,
          program: form.program,
          department: form.department,
          faculty: form.faculty,
          duration_of_course: form.duration_of_course,
          total_fees: form.total_fees,
          academic_session: form.academic_session,
        })
        .eq("id", editingId);

      if (error) toast.error("Update failed");
      else {
        toast.success("University record updated");
        setDialogOpen(false);
        fetchUniversities();
      }
    } else {
      const { error } = await supabase
        .from("universities")
        .insert([form]);

      if (error) toast.error("Insert failed");
      else {
        toast.success("University record added");
        setDialogOpen(false);
        fetchUniversities();
      }
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this university record?")) return;

    const { error } = await supabase
      .from("universities")
      .delete()
      .eq("id", id);

    if (error) toast.error("Delete failed");
    else {
      toast.success("University record deleted");
      fetchUniversities();
    }
  };

  const filtered = universities.filter((u) => {
    const q = search.toLowerCase();

    const matchesSearch =
      `${u.first_name} ${u.last_name} ${u.other_name || ""}`.toLowerCase().includes(q) ||
      u.matric_number.toLowerCase().includes(q) ||
      u.jamb_number.toLowerCase().includes(q) ||
      u.nin.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.faculty.toLowerCase().includes(q) ||
      u.program.toLowerCase().includes(q) ||
      u.email_address.toLowerCase().includes(q);

    const matchesFaculty = facultyFilter ? u.faculty === facultyFilter : true;
    const matchesDepartment = departmentFilter ? u.department === departmentFilter : true;
    const matchesLevel = levelFilter ? u.level === levelFilter : true;
    const matchesProgram = programFilter ? u.program === programFilter : true;

    return matchesSearch && matchesFaculty && matchesDepartment && matchesLevel && matchesProgram;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortBy) return 0;

    let aVal: any = a[sortBy as keyof University];
    let bVal: any = b[sortBy as keyof University];

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;

    return 0;
  });

  const totalPages = paginate ? Math.ceil(sorted.length / itemsPerPage) : 1;
  const paginatedUniversities = paginate
    ? sorted.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
    : sorted;

  const getSN = (index: number) => {
    return paginate
      ? (currentPage - 1) * itemsPerPage + index + 1
      : index + 1;
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    autoTable(doc, {
      head: [["S/N", "Full Name", "Matric Number", "JAMB Number", "Program", "Department", "Faculty", "Level", "Phone"]],
      body: paginatedUniversities.map((u, index) => [
        getSN(index),
        `${u.first_name} ${u.last_name} ${u.other_name || ""}`.trim(),
        u.matric_number,
        u.jamb_number,
        u.program,
        u.department,
        u.faculty,
        u.level,
        u.phone_number
      ]),
    });

    doc.save("universities.pdf");
  };

  const exportWord = async () => {
    let html = `<html><body><h1>University Records</h1><table border="1" cellpadding="6" cellspacing="0">`;

    html += `<tr>
    <th>S/N</th>
    <th>Full Name</th>
    <th>Matric Number</th>
    <th>JAMB Number</th>
    <th>Program</th>
    <th>Department</th>
    <th>Faculty</th>
    <th>Level</th>
    <th>Phone</th>
    </tr>`;

    paginatedUniversities.forEach((u, index) => {
      html += `<tr>
      <td>${getSN(index)}</td>
      <td>${u.first_name} ${u.last_name} ${u.other_name || ""}</td>
      <td>${u.matric_number}</td>
      <td>${u.jamb_number}</td>
      <td>${u.program}</td>
      <td>${u.department}</td>
      <td>${u.faculty}</td>
      <td>${u.level}</td>
      <td>${u.phone_number}</td>
      </tr>`;
    });

    html += "</table></body></html>";

    const blob = new Blob([html], { type: "application/msword" });
    const { saveAs } = await import("file-saver");

    saveAs(blob, "universities.doc");
  };

  const exportExcel = async () => {
    const { utils, writeFile } = await import("xlsx");

    // Prepare data with heading
    const data = [
      ["FOR UNIVERSITIES"],
      [], // Empty row for spacing
      [
        "S/N",
        "Registration/Matric Number",
        "First Name",
        "Last Name",
        "Other Name",
        "Date of Birth",
        "Gender",
        "State of Origin",
        "LGA",
        "Level",
        "Jamb Number",
        "NIN",
        "Phone Number",
        "Email Address",
        "Program",
        "Department",
        "Faculty",
        "Duration of Course",
        "Total Fees",
        "Academic Session"
      ]
    ];

    // Add university data
    paginatedUniversities.forEach((u, index) => {
      data.push([
        getSN(index).toString(),
        u.matric_number,
        u.first_name,
        u.last_name,
        u.other_name || "",
        u.date_of_birth,
        u.gender,
        u.state_of_origin,
        u.lga,
        u.level,
        u.jamb_number,
        u.nin,
        u.phone_number,
        u.email_address,
        u.program,
        u.department,
        u.faculty,
        u.duration_of_course,
        u.total_fees,
        u.academic_session
      ]);
    });

    // Create workbook and worksheet
    const wb = utils.book_new();
    const ws = utils.aoa_to_sheet(data);

    // Set column widths optimized for smaller font
    ws['!cols'] = [
      { wch: 4 },  // S/N
      { wch: 18 }, // Matric Number
      { wch: 12 }, // First Name
      { wch: 12 }, // Last Name
      { wch: 12 }, // Other Name
      { wch: 10 }, // Date of Birth
      { wch: 6 },  // Gender
      { wch: 12 }, // State of Origin
      { wch: 12 }, // LGA
      { wch: 6 },  // Level
      { wch: 12 }, // Jamb Number
      { wch: 12 }, // NIN
      { wch: 12 }, // Phone Number
      { wch: 20 }, // Email Address
      { wch: 15 }, // Program
      { wch: 15 }, // Department
      { wch: 15 }, // Faculty
      { wch: 12 }, // Duration of Course
      { wch: 10 }, // Total Fees
      { wch: 12 }  // Academic Session
    ];

    // Merge cells for the heading to center it
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 19 } }); // Merge A1 to T1

    // Add basic styling that works across Excel versions
    try {
      // Style the heading
      if (ws['A1']) {
        ws['A1'].s = {
          font: { bold: true },
          alignment: { horizontal: "center" }
        };
      }

      // Make header row bold
      for (let col = 0; col < 20; col++) {
        const headerCell = utils.encode_cell({ r: 2, c: col });
        if (ws[headerCell]) {
          ws[headerCell].s = {
            font: { bold: true }
          };
        }
      }
    } catch (e) {
      // If styling fails, continue without it
      console.log("Excel styling not supported in this environment");
    }

    utils.book_append_sheet(wb, ws, "Universities");
    writeFile(wb, "universities.xlsx");
  };

  if (fetching) {
    return (
      <div className="page-container flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="admin-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">University Records</h1>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => <option key={f}>{f}</option>)}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>

            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Programs</option>
              {programs.map((p) => <option key={p}>{p}</option>)}
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Levels</option>
              {levels.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <Button onClick={openAdd} size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPaginate(!paginate);
                setCurrentPage(1);
              }}
            >
              {paginate ? "Show All" : "Paginate (25/page)"}
            </Button>

            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="mr-1 h-4 w-4" /> PDF
            </Button>

            <Button variant="outline" size="sm" onClick={exportWord}>
              <File className="mr-1 h-4 w-4" /> Word
            </Button>

            <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
            </Button>
          </div>
        </div>

        <div className="form-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead
                  onClick={() => handleSort('first_name')}
                  className="cursor-pointer select-none"
                >
                  Full Name
                </TableHead>
                <TableHead>Matric Number</TableHead>
                <TableHead>JAMB Number</TableHead>
                <TableHead onClick={() => handleSort('program')} className="cursor-pointer">Program</TableHead>
                <TableHead onClick={() => handleSort('department')} className="cursor-pointer">Department</TableHead>
                <TableHead onClick={() => handleSort('faculty')} className="cursor-pointer">Faculty</TableHead>
                <TableHead onClick={() => handleSort('level')} className="cursor-pointer">Level</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedUniversities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10">
                    No results
                  </TableCell>
                </TableRow>
              ) : paginatedUniversities.map((u, index) => (
                <TableRow key={u.id}>
                  <TableCell>{getSN(index)}</TableCell>
                  <TableCell>{`${u.first_name} ${u.last_name} ${u.other_name || ""}`.trim()}</TableCell>
                  <TableCell>{u.matric_number}</TableCell>
                  <TableCell>{u.jamb_number}</TableCell>
                  <TableCell>{u.program}</TableCell>
                  <TableCell>{u.department}</TableCell>
                  <TableCell>{u.faculty}</TableCell>
                  <TableCell>{u.level}</TableCell>
                  <TableCell>{u.phone_number}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {paginate && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit University Record" : "Add University Record"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {Object.keys(emptyForm).map((key) => (
              <div key={key} className={key === 'email_address' || key === 'other_name' ? 'col-span-2' : ''}>
                <Label>{key.replace(/_/g, " ").toUpperCase()}</Label>
                {key === 'gender' ? (
                  <select
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                ) : key === 'date_of_birth' ? (
                  <Input
                    type="date"
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                ) : (
                  <Input
                    type={key === 'email_address' ? 'email' : key === 'phone_number' ? 'tel' : 'text'}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UniversitiesAdmin;