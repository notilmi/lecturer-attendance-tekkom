"use client";

import { database } from "@/lib/firebase";
import { get, onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Search, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Admin {
  id: string;
  email: string;
  createdAt: string;
}

export function AdminTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [addAdminOpen, setAddAdminOpen] = useState(false);

  useEffect(() => {
    const adminsRef = ref(database, "admins");
    const unsubscribe = onValue(adminsRef, (snapshot) => {
      const data = snapshot.val();
      const adminsList: Admin[] = [];

      for (const id in data) {
        adminsList.push({
          id,
          email: data[id].email,
          createdAt: new Date(data[id].createdAt).toLocaleDateString(),
        });
      }

      setAdmins(adminsList);
    });

    return () => unsubscribe();
  }, []);

  const filteredTags = admins.filter(
    (tag) =>
      tag.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Admin</CardTitle>
        <CardDescription>
          Kelola Admin yang terdaftar dalam sistem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari Admin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.createdAt}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAdmin(admin)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    // onClick={() => handleDelete(admin.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
