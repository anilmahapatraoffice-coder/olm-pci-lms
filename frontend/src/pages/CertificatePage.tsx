import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Download, ArrowLeft, Award, CheckCircle } from 'lucide-react';

interface CertData {
  certificate_number: string;
  issued_at: string;
  name: string;
  designation: string;
  district: string;
  block: string;
  gp: string;
  mobile: string;
  course_name: string;
  course_description: string;
  total_duration: string;
}

export default function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/certificates/certificate/${courseId}`)
      .then(r => setCert(r.data))
      .catch(e => setError(e.response?.data?.message || 'Certificate not found'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Certificate – ${cert?.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Open+Sans:wght@400;600&display=swap');
            * { margin:0; padding:0; box-sizing:border-box; }
            body { background: #fff; }
            @page { size: A4 landscape; margin: 0; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  if (loading) return <div className="loading">Loading certificate...</div>;
  if (error || !cert) return (
    <div className="cert-page">
      <div className="cert-error">
        <Award size={48} />
        <h3>{error || 'Certificate not available'}</h3>
        <button className="btn-outline" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </div>
  );

  const issueDate = new Date(cert.issued_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const location = [cert.gp, cert.block, cert.district].filter(Boolean).join(', ');

  return (
    <div className="cert-page">
      {/* Action bar */}
      <div className="cert-actions-bar">
        <button className="btn-outline btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>
        <div className="cert-actions-right">
          <button className="btn-primary" onClick={handlePrint}>
            <Download size={15} /> Download / Print Certificate
          </button>
        </div>
      </div>

      {/* Certificate Preview */}
      <div className="cert-preview-wrap">
        <div ref={printRef}>
          <div className="certificate-body">
            {/* Border decorations */}
            <div className="cert-border-outer">
              <div className="cert-border-inner">

                {/* Top Header */}
                <div className="cert-header">
                  <img src="/logos/odisha-logo.png" alt="Odisha" className="cert-logo" />
                  <div className="cert-header-center">
                    <div className="cert-header-tagline">Government of Odisha</div>
                    <div className="cert-org">Odisha Livelihoods Mission (OLM)</div>
                    <div className="cert-collab">in collaboration with</div>
                    <div className="cert-pci">PCI India</div>
                  </div>
                  <img src="/logos/pci-logo.png" alt="PCI" className="cert-logo" />
                </div>

                {/* Title */}
                <div className="cert-title-section">
                  <div className="cert-title-decoration">✦ ✦ ✦</div>
                  <h1 className="cert-title">Certificate of Completion</h1>
                  <div className="cert-title-decoration">✦ ✦ ✦</div>
                </div>

                {/* Body */}
                <div className="cert-body-text">
                  <p className="cert-presented">This is to certify that</p>

                  <div className="cert-name">{cert.name}</div>

                  {cert.designation && (
                    <p className="cert-role">{cert.designation}</p>
                  )}
                  {location && (
                    <p className="cert-location">{location}</p>
                  )}

                  <p className="cert-completion-text">
                    has successfully completed the course
                  </p>

                  <div className="cert-course-name">{cert.course_name}</div>

                  {cert.total_duration && (
                    <p className="cert-duration">Duration: {cert.total_duration}</p>
                  )}

                  <p className="cert-date-line">
                    Issued on <strong>{issueDate}</strong>
                  </p>
                </div>

                {/* Footer */}
                <div className="cert-footer">
                  <div className="cert-sig-block">
                    <div className="cert-sig-line" />
                    <div className="cert-sig-name">Programme Officer</div>
                    <div className="cert-sig-org">OLM, Odisha</div>
                  </div>

                  <div className="cert-seal">
                    <div className="cert-seal-circle">
                      <img src="/logos/olm-logo.png" alt="OLM" />
                    </div>
                    <div className="cert-cert-number">
                      Certificate No: <strong>{cert.certificate_number}</strong>
                    </div>
                  </div>

                  <div className="cert-sig-block">
                    <div className="cert-sig-line" />
                    <div className="cert-sig-name">Programme Director</div>
                    <div className="cert-sig-org">PCI India</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cert number display */}
      <div className="cert-number-display">
        <CheckCircle size={16} className="text-green" />
        Certificate No: <strong>{cert.certificate_number}</strong>
      </div>
    </div>
  );
}
