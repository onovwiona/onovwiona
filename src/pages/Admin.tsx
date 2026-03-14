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
  Plus, Pencil, Trash2, FileText, FileSpreadsheet, File, Search, LayoutDashboard,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Student = Tables<"students">;

const emptyForm = {
  full_name: "", faculty: "", department: "", level: "", mat_number: "", phone_number: "",
};

const Admin = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");

  const [facultyFilter, setFacultyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const itemsPerPage = 25;

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, full_name, faculty, department, level, mat_number, phone_number, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load students");
    else setStudents(data || []);

    setFetching(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const faculties = [...new Set(students.map((s) => s.faculty))];
  const departments = [...new Set(students.map((s) => s.department))];
  const levels = [...new Set(students.map((s) => s.level).filter(Boolean))];

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (s: Student) => {
    setEditingId(s.id);
    setForm({
      full_name: s.full_name,
      faculty: s.faculty,
      department: s.department,
      level: s.level || "",
      mat_number: s.mat_number,
      phone_number: s.phone_number
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.faculty || !form.department || !form.mat_number || !form.phone_number || (!editingId && (!form.level || isNaN(Number(form.level))))) {
      toast.error("All fields are required and level must be a number");
      return;
    }

    setSubmitting(true);

    if (editingId) {
      const { error } = await supabase
        .from("students")
        .update({
          full_name: form.full_name,
          faculty: form.faculty,
          department: form.department,
          mat_number: form.mat_number,
          phone_number: form.phone_number
        })
        .eq("id", editingId);

      if (error) toast.error(error.code === "23505" ? "Mat number already exists" : "Update failed");
      else {
        toast.success("Student updated");
        setDialogOpen(false);
        fetchStudents();
      }

    } else {

      const { error } = await supabase.from("students").insert([form]);

      if (error) toast.error(error.code === "23505" ? "Mat number already exists" : "Insert failed");
      else {
        toast.success("Student added");
        setDialogOpen(false);
        fetchStudents();
      }
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this student?")) return;

    const { error } = await supabase.from("students").delete().eq("id", id);

    if (error) toast.error("Delete failed");
    else {
      toast.success("Student deleted");
      fetchStudents();
    }
  };

  const filtered = students.filter((s) => {

    const q = search.toLowerCase();

    const matchesSearch =
      s.full_name.toLowerCase().includes(q) ||
      s.mat_number.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.faculty.toLowerCase().includes(q) ||
      (s.level && s.level.toLowerCase().includes(q));

    const matchesFaculty = facultyFilter ? s.faculty === facultyFilter : true;
    const matchesDepartment = departmentFilter ? s.department === departmentFilter : true;
    const matchesLevel = levelFilter ? s.level === levelFilter : true;

    return matchesSearch && matchesFaculty && matchesDepartment && matchesLevel;
  });

  const sorted = [...filtered].sort((a, b) => {

    if (!sortBy) return 0;

    let aVal: any = a[sortBy as keyof Student];
    let bVal: any = b[sortBy as keyof Student];

    if (sortBy === 'level') {
      aVal = parseInt(aVal || '0');
      bVal = parseInt(bVal || '0');
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;

    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  const paginatedStudents = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );




  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["S/N", "Full Name", "Faculty", "Department", "Level", "Mat Number", "Phone"]],
      body: paginatedStudents.map((s, index) => [(currentPage - 1) * itemsPerPage + index + 1, s.full_name, s.faculty, s.department, s.level, s.mat_number, s.phone_number]),
    });
    doc.save("students.pdf");
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(paginatedStudents.map((s, index) => ({
      "S/N": (currentPage - 1) * itemsPerPage + index + 1,
      "Full Name": s.full_name, Faculty: s.faculty, Department: s.department, Level: s.level,
      "Mat Number": s.mat_number, "Phone Number": s.phone_number,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students.xlsx");
  };

  const exportWord = async () => {
    let html = `<html><head><meta charset="utf-8"><title>Students</title></head><body>
      <h1>Student Records</h1>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        <tr><th>S/N</th><th>Full Name</th><th>Faculty</th><th>Department</th><th>Level</th><th>Mat Number</th><th>Phone</th></tr>`;
    paginatedStudents.forEach((s, index) => {
      html += `<tr><td>${(currentPage - 1) * itemsPerPage + index + 1}</td><td>${s.full_name}</td><td>${s.faculty}</td><td>${s.department}</td><td>${s.level}</td><td>${s.mat_number}</td><td>${s.phone_number}</td></tr>`;
    });
    html += `</table></body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const { saveAs } = await import("file-saver");
    saveAs(blob, "students.doc");
  };

  if (fetching) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">

      <div className="admin-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Student Records</h1>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* SEARCH + FILTERS */}

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">

          {/* LEFT SIDE : SEARCH + FILTERS */}

          <div className="flex flex-wrap gap-2 w-full">

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            <select
              className="border rounded px-2 py-1 text-sm"
              value={facultyFilter}
              onChange={(e) => {
                setFacultyFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <select
              className="border rounded px-2 py-1 text-sm"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              className="border rounded px-2 py-1 text-sm"
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Levels</option>
              {levels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

          </div>

          {/* RIGHT SIDE : ACTION BUTTONS */}

          <div className="flex gap-2 ">

            <Button onClick={openAdd} size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>

            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="mr-1 h-4 w-4" /> PDF
            </Button>

            {/* <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
            </Button> */}

            <Button variant="outline" size="sm" onClick={exportWord}>
              <File className="mr-1 h-4 w-4" /> Word
            </Button>

          </div>

        </div>

        {/* TABLE */}

        <div className="form-card overflow-x-auto p-0">

          <Table>

            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead onClick={() => handleSort('faculty')} className="cursor-pointer">Faculty</TableHead>
                <TableHead onClick={() => handleSort('department')} className="cursor-pointer">Department</TableHead>
                <TableHead onClick={() => handleSort('level')} className="cursor-pointer">Level</TableHead>
                <TableHead>Mat Number</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>

              {paginatedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    No results found
                  </TableCell>
                </TableRow>
              ) : paginatedStudents.map((s, index) => (

                <TableRow key={s.id}>

                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{s.full_name}</TableCell>
                  <TableCell>{s.faculty}</TableCell>
                  <TableCell>{s.department}</TableCell>
                  <TableCell>{s.level}</TableCell>
                  <TableCell>{s.mat_number}</TableCell>
                  <TableCell>{s.phone_number}</TableCell>

                  <TableCell className="text-right">

                    <div className="flex gap-1 justify-end">

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>

                    </div>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        </div>

      </div>

    </div>
  );
};

export default Admin;