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
  Plus, Pencil, Trash2, FileText, File, Search, LayoutDashboard,
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
  const [paginate, setPaginate] = useState(false);

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const itemsPerPage = 25;

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load students");
    else setStudents(data || []);

    setFetching(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const faculties = [...new Set(students.map((s) => s.faculty))];
  const departments = [...new Set(students.map((s) => s.department))];
  const levels = ["100", "200", "300", "400", "500", "600", "700"];

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
      toast.error("All fields are required");
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

      if (error) toast.error("Update failed");
      else {
        toast.success("Student updated");
        setDialogOpen(false);
        fetchStudents();
      }

    } else {

      const { error } = await supabase
        .from("students")
        .insert([form]);

      if (error) toast.error("Insert failed");
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

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

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

  const totalPages = paginate ? Math.ceil(sorted.length / itemsPerPage) : 1;

  const paginatedStudents = paginate
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
      head: [["S/N", "Full Name", "Faculty", "Department", "Level", "Mat Number", "Phone"]],
      body: paginatedStudents.map((s, index) => [
        getSN(index),
        s.full_name,
        s.faculty,
        s.department,
        s.level,
        s.mat_number,
        s.phone_number
      ]),
    });

    doc.save("students.pdf");

  };

  const exportWord = async () => {

    let html = `<html><body><h1>Student Records</h1><table border="1" cellpadding="6" cellspacing="0">`;

    html += `<tr>
    <th>S/N</th>
    <th>Name</th>
    <th>Faculty</th>
    <th>Department</th>
    <th>Level</th>
    <th>Mat Number</th>
    <th>Phone</th>
    </tr>`;

    paginatedStudents.forEach((s, index) => {

      html += `<tr>
      <td>${getSN(index)}</td>
      <td>${s.full_name}</td>
      <td>${s.faculty}</td>
      <td>${s.department}</td>
      <td>${s.level}</td>
      <td>${s.mat_number}</td>
      <td>${s.phone_number}</td>
      </tr>`;

    });

    html += "</table></body></html>";

    const blob = new Blob([html], { type: "application/msword" });
    const { saveAs } = await import("file-saver");

    saveAs(blob, "students.doc");

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
          <h1 className="text-xl font-bold">Student Records</h1>
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

          </div>

        </div>

        <div className="form-card overflow-x-auto">

          <Table>

            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead
                  onClick={() => handleSort('full_name')}
                  className="cursor-pointer select-none"
                >
                  Full Name
                </TableHead>
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
                  <TableCell colSpan={8} className="text-center py-10">
                    No results
                  </TableCell>
                </TableRow>
              ) : paginatedStudents.map((s, index) => (

                <TableRow key={s.id}>

                  <TableCell>{getSN(index)}</TableCell>
                  <TableCell>{s.full_name}</TableCell>
                  <TableCell>{s.faculty}</TableCell>
                  <TableCell>{s.department}</TableCell>
                  <TableCell>{s.level}</TableCell>
                  <TableCell>{s.mat_number}</TableCell>
                  <TableCell>{s.phone_number}</TableCell>

                  <TableCell className="text-right">

                    <div className="flex gap-1 justify-end">

                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
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
        <DialogContent>

          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Student" : "Add Student"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            {Object.keys(emptyForm).map((key) => (

              <div key={key}>

                <Label>{key.replace("_", " ").toUpperCase()}</Label>

                <Input
                  type={key === "level" ? "number" : "text"}
                  value={(form as any)[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.value })
                  }
                />

              </div>

            ))}

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save"}
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Admin;