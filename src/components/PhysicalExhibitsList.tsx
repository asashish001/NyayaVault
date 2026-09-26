"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Exhibit {
  id: string;
  caseId: string;
  exhibitNumber: string;
  description: string;
  status: string;
  currentLocation: string;
  createdAt: string;
}

export function PhysicalExhibitsList({ caseId }: { caseId: string }) {
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newExhibit, setNewExhibit] = useState({
    exhibitNumber: "",
    description: "",
    currentLocation: "",
  });

  const [selectedQr, setSelectedQr] = useState<Exhibit | null>(null);

  useEffect(() => {
    fetchExhibits();
  }, [caseId]);

  const fetchExhibits = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/exhibits`);
      if (res.ok) {
        const data = await res.json();
        setExhibits(data);
      }
    } catch (error) {
      console.error("Failed to fetch exhibits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExhibit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/cases/${caseId}/exhibits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExhibit),
      });
      if (res.ok) {
        setNewExhibit({ exhibitNumber: "", description: "", currentLocation: "" });
        setIsAdding(false);
        fetchExhibits();
      } else {
        alert("Failed to add exhibit. Ensure you have IO or SHO permissions.");
      }
    } catch (error) {
      console.error(error);
      alert("Error adding exhibit.");
    }
  };

  return (
    <Card className="mt-6 border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Physical Exhibits (Malkhana Register)</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? "Cancel" : "+ Add Exhibit"}
        </Button>
      </CardHeader>
      
      <CardContent>
        {isAdding && (
          <div className="mb-6 rounded border bg-slate-50 p-4">
            <h3 className="mb-3 font-semibold text-slate-800">Add New Physical Exhibit</h3>
            <form onSubmit={handleAddExhibit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500">Exhibit / Asset Number</label>
                  <input 
                    required 
                    type="text" 
                    className="mt-1 w-full rounded border px-3 py-2 text-sm" 
                    placeholder="e.g. EX-2026-001"
                    value={newExhibit.exhibitNumber}
                    onChange={e => setNewExhibit({...newExhibit, exhibitNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Current Location</label>
                  <input 
                    required 
                    type="text" 
                    className="mt-1 w-full rounded border px-3 py-2 text-sm" 
                    placeholder="e.g. Station Lockup / FSL Delhi"
                    value={newExhibit.currentLocation}
                    onChange={e => setNewExhibit({...newExhibit, currentLocation: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Description</label>
                <textarea 
                  required 
                  className="mt-1 w-full rounded border px-3 py-2 text-sm" 
                  rows={2}
                  placeholder="Describe the physical asset (e.g. Murder weapon, seized laptop)"
                  value={newExhibit.description}
                  onChange={e => setNewExhibit({...newExhibit, description: e.target.value})}
                />
              </div>
              <Button type="submit" size="sm" className="bg-navy hover:bg-navy/90 text-white">Save to Registry</Button>
            </form>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading registry...</p>
        ) : exhibits.length === 0 ? (
          <p className="text-sm text-slate-600">No physical exhibits registered for this case.</p>
        ) : (
          <div className="space-y-3">
            {exhibits.map(exhibit => (
              <div key={exhibit.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-navy">{exhibit.exhibitNumber}</p>
                    <Badge tone="slate">{exhibit.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{exhibit.description}</p>
                  <p className="text-xs text-slate-500 mt-1">Location: {exhibit.currentLocation} | Registered: {new Date(exhibit.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedQr(selectedQr?.id === exhibit.id ? null : exhibit)}
                  >
                    {selectedQr?.id === exhibit.id ? "Hide QR" : "Show QR Label"}
                  </Button>
                </div>
                
                {selectedQr?.id === exhibit.id && (
                  <div className="w-full mt-2 rounded bg-white p-4 border flex flex-col items-center justify-center">
                    <p className="text-sm font-bold mb-2 uppercase tracking-wide">Malkhana Asset Label</p>
                    <div className="p-2 border-2 border-dashed border-slate-300 inline-block bg-white">
                      <QRCodeCanvas 
                        id={`qr-canvas-${exhibit.id}`}
                        value={`Exhibit: ${exhibit.exhibitNumber}\n\nID: ${exhibit.id}`} 
                        size={200} 
                        level={"L"}
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-xs font-mono mt-2">{exhibit.exhibitNumber}</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => {
                      const canvas = document.querySelector(`#qr-canvas-${exhibit.id}`) as HTMLCanvasElement;
                      if (canvas) {
                        const dataUrl = canvas.toDataURL("image/png");
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Print Label</title>
                                <style>
                                  body { display: flex; flex-direction: column; align-items: center; margin-top: 50px; font-family: sans-serif; }
                                  .label { border: 2px dashed #94a3b8; padding: 20px; text-align: center; max-width: 300px; }
                                  img { margin-bottom: 10px; width: 200px; height: 200px; }
                                  h2 { margin: 0 0 15px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
                                  .asset-no { margin: 0; font-family: monospace; font-size: 16px; font-weight: bold; }
                                  .details { margin-top: 15px; text-align: left; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
                                  .details p { margin: 4px 0; font-family: sans-serif; font-size: 12px; font-weight: normal; line-height: 1.4; }
                                  .details strong { color: #334155; }
                                </style>
                              </head>
                              <body>
                                <div class="label">
                                  <h2>Malkhana Asset Label</h2>
                                  <img src="${dataUrl}" alt="QR Code" />
                                  <p class="asset-no">${exhibit.exhibitNumber}</p>
                                  <div class="details">
                                    <p><strong>Item:</strong> ${exhibit.description}</p>
                                    <p><strong>Location:</strong> ${exhibit.currentLocation}</p>
                                    <p><strong>Logged:</strong> ${new Date(exhibit.createdAt).toLocaleDateString("en-IN")}</p>
                                  </div>
                                </div>
                                <script>
                                  window.onload = () => { window.print(); window.close(); }
                                </script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }
                    }}>
                      Print Label
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
