
import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  // ====================================
  // STATES
  // ====================================

  const [page, setPage] = useState("home");
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [capturing, setCapturing] = useState(false);

  // Editor states
  const [selectedFilter, setSelectedFilter] = useState("original");
  const [selectedFrame, setSelectedFrame] = useState("classic");
  const [selectedSticker, setSelectedSticker] = useState("✿");

  // Sticker position in percentage
  const [stickerPosition, setStickerPosition] = useState({
    x: 85,
    y: 15,
  });

  const [draggingSticker, setDraggingSticker] = useState(false);

    // ====================================
  // VISITOR FORM STATES
  // ====================================

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // References
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const dragPointerRef = useRef(null);

  // ====================================
  // FILTER CONFIGURATION
  // ====================================

  const filters = [
    { id: "original", name: "Original", css: "none" },
    {
      id: "warm",
      name: "Warm Vintage",
      css: "sepia(20%) saturate(125%) brightness(105%)",
    },
    {
      id: "sepia",
      name: "Sepia",
      css: "sepia(75%) contrast(95%)",
    },
    {
      id: "faded",
      name: "Faded Film",
      css: "sepia(25%) contrast(85%) brightness(110%) saturate(75%)",
    },
    {
      id: "bw",
      name: "Black & White",
      css: "grayscale(100%) contrast(110%)",
    },
  ];

  // ====================================
  // FRAME CONFIGURATION
  // ====================================

  const frames = [
    {
      id: "classic",
      name: "Classic Cream",
      background: "#fffaf1",
      border: "#d9c8aa",
      color: "#4c3528",
      borderStyle: "solid",
    },
    {
      id: "film",
      name: "Vintage Film",
      background: "#29231e",
      border: "#b99b72",
      color: "#fff4df",
      borderStyle: "dashed",
    },
    {
      id: "rose",
      name: "Rose Vintage",
      background: "#f7e6df",
      border: "#d8aaa0",
      color: "#874d49",
      borderStyle: "double",
    },
    {
      id: "sage",
      name: "Sage Garden",
      background: "#e9eee2",
      border: "#89977c",
      color: "#45533e",
      borderStyle: "solid",
    },
    {
      id: "midnight",
      name: "Midnight",
      background: "#292d38",
      border: "#c2a878",
      color: "#fff2d6",
      borderStyle: "dashed",
    },
    {
      id: "lavender",
      name: "Lavender",
      background: "#eee8f3",
      border: "#b4a0c8",
      color: "#574665",
      borderStyle: "double",
    },
  ];

  // ====================================
  // STICKERS
  // ====================================

  const stickers = ["✿", "♡", "★", "☻", "✳"];

  // ====================================
  // EDITOR STYLES
  // ====================================

  const editorButtonStyle = {
    padding: "10px 14px",
    background: "#f4ede2",
    color: "#4c3528",
    border: "1px solid #e5d8c5",
    borderRadius: "4px",
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    fontSize: "12px",
  };

  const editorDividerStyle = {
    border: "none",
    borderTop: "1px solid #e9dfd0",
  };

  // ====================================
  // CAMERA EFFECT
  // ====================================

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // ====================================
  // CLEANUP CAMERA
  // ====================================

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  // ====================================
  // TEST SUPABASE CONNECTION
  // ====================================

  useEffect(() => {
    const testSupabase = async () => {
      const { data, error } = await supabase
        .from("photobooth_sessions")
        .select("id")
        .limit(1);

      if (error) {
        console.error("Supabase connection test:", error);
      } else {
        console.log("Supabase berhasil terhubung!");
        console.log("Data:", data);
      }
    };

    testSupabase();
  }, []);

  // ====================================
  // START CAMERA
  // ====================================

  const startCamera = async () => {
    try {
      setCameraError("");
      setCameraReady(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser tidak mendukung akses kamera.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (error) {
      console.error(error);
      setCameraError(
        "Kamera tidak dapat diakses. Periksa izin kamera dan pastikan kamera tidak sedang digunakan aplikasi lain."
      );
    }
  };

  // ====================================
  // CAPTURE PHOTO
  // ====================================

  const capturePhoto = () => {
    const video = videoRef.current;

    if (!video || video.readyState < 2) {
      return null;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    // Mirror selfie
    context.translate(canvas.width, 0);
    context.scale(-1, 1);

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  // ====================================
  // COUNTDOWN
  // ====================================

  const wait = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // ====================================
  // CAPTURE THREE PHOTOS
  // ====================================

  const startCapture = async () => {
    if (!cameraReady || capturing) return;

    setCapturing(true);
    setCameraError("");
    setPhotos([]);

    const capturedPhotos = [];

    try {
      for (let i = 0; i < 3; i++) {
        for (let time = 3; time >= 1; time--) {
          setCountdown(time);
          await wait(1000);
        }

        setCountdown(null);

        const photo = capturePhoto();

        if (!photo) {
          throw new Error("Gagal mengambil foto.");
        }

        capturedPhotos.push(photo);
        setPhotos([...capturedPhotos]);

        if (i < 2) {
          await wait(1200);
        }
      }
    } catch (error) {
      console.error(error);
      setCameraError(error.message);
    } finally {
      setCountdown(null);
      setCapturing(false);
    }
  };

  // ====================================
  // STOP CAMERA
  // ====================================

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    streamRef.current = null;
    setStream(null);
    setCameraReady(false);
  };

  // ====================================
  // GO HOME
  // ====================================

  const goHome = () => {
    if (capturing) return;

    stopCamera();
    setPhotos([]);
    setCameraError("");
    setPage("home");
  };

  // ====================================
  // STICKER DRAG FUNCTIONS
  // ====================================

  const handleStickerPointerDown = (e) => {
    e.preventDefault();

    dragPointerRef.current = e.pointerId;

    e.currentTarget.setPointerCapture(e.pointerId);

    setDraggingSticker(true);
  };

  const handleStickerPointerMove = (e) => {
    if (
      !draggingSticker ||
      dragPointerRef.current !== e.pointerId
    ) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setStickerPosition({
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    });
  };

  const handleStickerPointerUp = (e) => {
    if (
      dragPointerRef.current !== null &&
      e.pointerId !== dragPointerRef.current
    ) {
      return;
    }

    dragPointerRef.current = null;
    setDraggingSticker(false);
  };

  // ====================================
  // RESET EDITOR
  // ====================================

  const resetEditor = () => {
    setSelectedFilter("original");
    setSelectedFrame("classic");
    setSelectedSticker("✿");

    setStickerPosition({
      x: 85,
      y: 15,
    });

    dragPointerRef.current = null;
    setDraggingSticker(false);
  };

    // ====================================
  // GO TO VISITOR FORM
  // ====================================

  const goToVisitorForm = () => {
    setSaveStatus("");
    setPage("form");
  };

  // ====================================
  // DOWNLOAD & SAVE PHOTO STRIP
  // ====================================

  const downloadPhotoStrip = async () => {
    if (photos.length !== 3) {
      setSaveStatus("Tiga foto belum tersedia.");
      return;
    }

    if (!guestName.trim() || !guestEmail.trim()) {
      setSaveStatus("Nama dan email wajib diisi.");
      return;
    }

    setSaving(true);
    setSaveStatus("");

    try {
      const images = await Promise.all(
        photos.map(
          (src) =>
            new Promise((resolve, reject) => {
              const image = new Image();

              image.onload = () => resolve(image);
              image.onerror = () =>
                reject(new Error("Gagal memuat foto."));

              image.src = src;
            })
        )
      );

      const canvas = document.createElement("canvas");

      const width = 600;
      const padding = 30;
      const photoWidth = width - padding * 2;
      const photoHeight = 405;
      const gap = 15;

      canvas.width = width;
      canvas.height =
        90 + padding + photoHeight * 3 + gap * 2 + 80;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas tidak tersedia.");
      }

      const frame = frames.find(
        (item) => item.id === selectedFrame
      );

      const filter = filters.find(
        (item) => item.id === selectedFilter
      );

      // Background
      ctx.fillStyle = frame.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = frame.color;
      ctx.textAlign = "center";
      ctx.font = "bold 30px Georgia";
      ctx.fillText("RETRO BOOTH", width / 2, 50);

      ctx.font = "14px Georgia";
      ctx.fillText(
        "A LITTLE MOMENT TO REMEMBER",
        width / 2,
        72
      );

      // Image crop
      const drawImageCover = (
        image,
        x,
        y,
        targetWidth,
        targetHeight
      ) => {
        const sourceRatio = image.width / image.height;
        const targetRatio = targetWidth / targetHeight;

        let sx = 0;
        let sy = 0;
        let sw = image.width;
        let sh = image.height;

        if (sourceRatio > targetRatio) {
          sw = image.height * targetRatio;
          sx = (image.width - sw) / 2;
        } else {
          sh = image.width / targetRatio;
          sy = (image.height - sh) / 2;
        }

        ctx.save();
        ctx.filter = filter.css;

        ctx.drawImage(
          image,
          sx,
          sy,
          sw,
          sh,
          x,
          y,
          targetWidth,
          targetHeight
        );

        ctx.restore();
      };

      // Three photos
      images.forEach((image, index) => {
        const x = padding;
        const y = 90 + padding + index * (photoHeight + gap);

        drawImageCover(
          image,
          x,
          y,
          photoWidth,
          photoHeight
        );

        // Vintage border
        ctx.save();

        ctx.strokeStyle = frame.border;
        ctx.lineWidth = 8;

        if (frame.borderStyle === "dashed") {
          ctx.setLineDash([12, 7]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.strokeRect(
          x - 4,
          y - 4,
          photoWidth + 8,
          photoHeight + 8
        );

        if (frame.borderStyle === "double") {
          ctx.lineWidth = 2;
          ctx.strokeRect(
            x + 5,
            y + 5,
            photoWidth - 10,
            photoHeight - 10
          );
        }

        ctx.restore();

        // Sticker
        ctx.save();

        ctx.font = "42px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 5;

        const stickerX =
          x + (photoWidth * stickerPosition.x) / 100;

        const stickerY =
          y + (photoHeight * stickerPosition.y) / 100;

        ctx.fillText(
          selectedSticker,
          stickerX,
          stickerY
        );

        ctx.restore();
      });

      // Footer
      ctx.fillStyle = frame.color;
      ctx.font = "bold 20px Georgia";
      ctx.textAlign = "center";

      ctx.fillText(
        "MEMORIES TO KEEP",
        width / 2,
        canvas.height - 30
      );

      // ====================================
      // CONVERT CANVAS TO BLOB
      // ====================================

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Gagal membuat file JPG."));
            }
          },
          "image/jpeg",
          0.95
        );
      });

      // ====================================
      // UPLOAD TO SUPABASE STORAGE
      // ====================================

      const fileName = `retrobooth-${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("photo-strips")
          .upload(fileName, blob, {
            contentType: "image/jpeg",
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      console.log("Foto berhasil diupload:", uploadData);

      // ====================================
      // SAVE SESSION TO DATABASE
      // ====================================

      const { error: insertError } = await supabase
        .from("photobooth_sessions")
        .insert({
          guest_name: guestName.trim(),
          email: guestEmail.trim(),
          storage_path: uploadData.path,
        });

      if (insertError) {
        throw insertError;
      }

      console.log("Data sesi berhasil disimpan!");

      // ====================================
      // DOWNLOAD PHOTO TO COMPUTER
      // ====================================

      const imageUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = "retro-booth-edited.jpg";
      link.href = imageUrl;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(imageUrl);

      setSaveStatus(
        "Berhasil! Foto sudah tersimpan dan terunduh. ♡"
      );

    } catch (error) {
      console.error("Gagal menyimpan photo strip:", error);

      setSaveStatus(
        `Gagal menyimpan foto: ${error.message}`
      );
    } finally {
      setSaving(false);
    }
  };


  // ====================================
  // HOMEPAGE
  // ====================================

  if (page === "home") {
    return (
      <div className="website">
        <header className="navbar">
          <a href="#home" className="brand">
            <span className="brand-icon">✳</span>
            retro<span>booth.</span>
          </a>

          <nav className="nav-menu">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#how-it-works">How It Works</a>
          </nav>

          <button
            className="nav-button"
            onClick={() => setPage("studio")}
          >
            Let's Capture ↗
          </button>
        </header>

        <main>
          <section className="hero" id="home">
            <div className="hero-content">
              <div className="eyebrow">
                <span className="eyebrow-dot"></span>
                YOUR LITTLE CORNER OF MEMORIES
              </div>

              <h1>
                Freeze the moment,
                <br />
                <span>keep it forever.</span>
              </h1>

              <p className="hero-description">
                Little moments deserve to be remembered.
                Capture your favorite memories, add a touch
                of vintage magic, and turn them into
                something worth keeping.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-button"
                  onClick={() => setPage("studio")}
                >
                  Start Your Session ↗
                </button>

                <a href="#about" className="secondary-button">
                  Explore More
                </a>
              </div>

              <div className="hero-note">
                <span>✳</span>
                Made for memories, not perfection.
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-sun">✳</div>

              <div className="floating-label label-top">
                GOOD TIMES ONLY!
              </div>

              <div className="photo-strip">
                <div className="strip-top">
                  <span>RETRO BOOTH</span>
                  <span>№ 001</span>
                </div>

                <div className="photo-frame photo-one">
                  <span className="photo-emoji">☻</span>
                  <span className="photo-number">01</span>
                </div>

                <div className="photo-frame photo-two">
                  <span className="photo-emoji">✿</span>
                  <span className="photo-number">02</span>
                </div>

                <div className="photo-frame photo-three">
                  <span className="photo-emoji">♡</span>
                  <span className="photo-number">03</span>
                </div>

                <div className="strip-bottom">
                  <span>MEMORIES TO KEEP</span>
                  <span>2026</span>
                </div>
              </div>

              <div className="floating-sticker sticker-star">✳</div>
              <div className="floating-sticker sticker-heart">♥</div>

              <div className="floating-label label-bottom">
                A LITTLE BIT OF NOSTALGIA
              </div>
            </div>
          </section>

          <div className="marquee">
            <div className="marquee-content">
              <span>✳ CAPTURE THE MOMENT</span>
              <span>♡ KEEP THE MEMORY</span>
              <span>✳ MAKE IT VINTAGE</span>
              <span>♡ CAPTURE THE MOMENT</span>
              <span>✳ KEEP THE MEMORY</span>
            </div>
          </div>

          <section className="about-section" id="about">
            <div className="section-heading">
              <span className="section-label">
                A LITTLE INTRODUCTION
              </span>

              <h2>
                More than just a photo,
                <br />
                <span>it's a little memory.</span>
              </h2>

              <p>
                Retro Booth brings back the charm of classic
                photobooths. Take your pictures, play with
                vintage filters, and create your own
                timeless photo strip.
              </p>
            </div>

            <div className="feature-grid">
              <article className="feature-card">
                <div className="feature-icon">◎</div>
                <span className="feature-number">01 / CAPTURE</span>
                <h3>Strike a Pose</h3>
                <p>
                  Take three pictures and make every moment
                  count with our simple camera experience.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-icon">✿</div>
                <span className="feature-number">02 / CUSTOMIZE</span>
                <h3>Make It Yours</h3>
                <p>
                  Add vintage filters, playful stickers,
                  and beautiful frames to your pictures.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-icon">♡</div>
                <span className="feature-number">03 / SAVE</span>
                <h3>Keep Forever</h3>
                <p>
                  Turn your pictures into a lovely photo
                  strip and save your favorite memories.
                </p>
              </article>
            </div>
          </section>

          <section className="how-section" id="how-it-works">
            <div className="how-content">
              <span className="section-label">
                YOUR MEMORY STARTS HERE
              </span>

              <h2>
                Ready for a little
                <br />
                <span>photo magic?</span>
              </h2>

              <p>
                Three shots, endless memories.
                Your own little photobooth is just around
                the corner.
              </p>

              <button
                className="primary-button"
                onClick={() => setPage("studio")}
              >
                Start Photobooth ↗
              </button>
            </div>

            <div className="how-decoration">
              <div className="camera-icon">📷</div>
              <div className="camera-caption">
                SMILE! YOU'RE ON CAMERA
              </div>
              <div className="camera-sparkle">✳</div>
            </div>
          </section>
        </main>

        <footer className="footer">
          <a href="#home" className="brand">
            <span className="brand-icon">✳</span>
            retro<span>booth.</span>
          </a>

          <p>Made with love & a little nostalgia.</p>

          <span className="footer-year">
            © 2026 RETRO BOOTH
          </span>
        </footer>
      </div>
    );
  }

  // ====================================
  // VISITOR FORM PAGE
  // ====================================

  if (page === "form") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#faf5ec",
          color: "#4c3528",
          padding: "30px 20px",
          fontFamily: "Georgia, serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            maxWidth: "1100px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <button
            onClick={() => setPage("editor")}
            style={editorButtonStyle}
          >
            ← Back to Editor
          </button>

          <h2 style={{ margin: 0 }}>✳ RETRO BOOTH</h2>

          <span style={{ fontSize: "12px" }}>
            YOUR PHOTO · 2026
          </span>
        </header>

        {/* FORM CONTENT */}
        <main
          style={{
            width: "100%",
            maxWidth: "520px",
            margin: "auto",
            padding: "45px 0",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "35px",
            }}
          >
            <p
              style={{
                color: "#a4493d",
                letterSpacing: "3px",
                fontSize: "12px",
              }}
            >
              ONE LAST LITTLE THING
            </p>

            <h1
              style={{
                fontSize: "38px",
                margin: "12px 0",
              }}
            >
              Keep Your <span style={{ color: "#a4493d" }}>
                Memories.
              </span>
            </h1>

            <p
              style={{
                color: "#8b7869",
                lineHeight: 1.7,
                fontSize: "14px",
              }}
            >
              Fill in your details so we can save your
              photo strip and send a copy of your memories
              straight to your email.
            </p>
          </div>

          <form
          
          onSubmit={(e) => {
            e.preventDefault();
            downloadPhotoStrip();
          }}
            style={{
              background: "#fffdf8",
              border: "1px solid #e9dfd0",
              borderRadius: "8px",
              padding: "30px",
              boxShadow: "0 10px 30px rgba(76,53,40,0.07)",
            }}
          >
            {/* GUEST NAME */}
            <div style={{ marginBottom: "22px" }}>
              <label
                htmlFor="guestName"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "bold",
                  marginBottom: "9px",
                }}
              >
                Your Name
              </label>

              <input
                id="guestName"
                type="text"
                placeholder="Enter your name..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #e5d8c5",
                  borderRadius: "4px",
                  background: "#faf5ec",
                  color: "#4c3528",
                  fontFamily: "Georgia, serif",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  outlineColor: "#a4493d",
                }}
              />
            </div>

            {/* GUEST EMAIL */}
            <div style={{ marginBottom: "25px" }}>
              <label
                htmlFor="guestEmail"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "bold",
                  marginBottom: "9px",
                }}
              >
                Email Address
              </label>

              <input
                id="guestEmail"
                type="email"
                placeholder="Enter your email..."
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #e5d8c5",
                  borderRadius: "4px",
                  background: "#faf5ec",
                  color: "#4c3528",
                  fontFamily: "Georgia, serif",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  outlineColor: "#a4493d",
                }}
              />
            </div>

            {/* STATUS */}
            {saveStatus && (
              <p
                style={{
                  color: "#a4493d",
                  fontSize: "13px",
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                {saveStatus}
              </p>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                padding: "16px",
                background: "#a4493d",
                color: "#fffaf1",
                border: "none",
                fontFamily: "Georgia, serif",
                fontSize: "15px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              {saving ? "Saving..." : "Save My Memories ♡"}
            </button>

            <p
              style={{
                textAlign: "center",
                color: "#a18e7d",
                fontSize: "11px",
                marginTop: "18px",
              }}
            >
              ✳ YOUR MEMORIES ARE SPECIAL TO US ✳
            </p>
          </form>
        </main>

        <footer
          style={{
            textAlign: "center",
            color: "#a4493d",
            fontSize: "12px",
            letterSpacing: "2px",
          }}
        >
          ✳ MADE WITH LOVE & A LITTLE NOSTALGIA ✳
        </footer>
      </div>
    );
  }

  // ====================================
  // PHOTO EDITOR
  // ====================================

  if (page === "editor") {
    const activeFilter = filters.find(
      (item) => item.id === selectedFilter
    );

    const activeFrame = frames.find(
      (item) => item.id === selectedFrame
    );

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#faf5ec",
          color: "#4c3528",
          padding: "30px 20px",
          fontFamily: "Georgia, serif",
        }}
      >
        <header
          style={{
            maxWidth: "1100px",
            margin: "0 auto 35px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <button
            onClick={() => setPage("studio")}
            style={editorButtonStyle}
          >
            ← Back to Studio
          </button>

          <h2 style={{ margin: 0 }}>✳ RETRO BOOTH</h2>

          <span style={{ fontSize: "12px" }}>
            PHOTO EDITOR · 2026
          </span>
        </header>

        <main style={{ maxWidth: "1100px", margin: "auto" }}>
          <div
            style={{
              textAlign: "center",
              marginBottom: "35px",
            }}
          >
            <p style={{ color: "#a4493d", letterSpacing: "3px" }}>
              MAKE IT YOUR OWN
            </p>

            <h1 style={{ fontSize: "42px", margin: "10px 0" }}>
              A Little Photo Magic.
            </h1>

            <p style={{ color: "#8b7869" }}>
              Customize your memories with a touch of vintage.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "35px",
              alignItems: "start",
            }}
          >
            {/* PREVIEW */}
            <section
              style={{
                background: activeFrame.background,
                border: `8px ${activeFrame.borderStyle} ${activeFrame.border}`,
                padding: "22px",
                boxShadow: "0 10px 30px rgba(76,53,40,0.12)",
                maxWidth: "440px",
                width: "100%",
                margin: "auto",
                boxSizing: "border-box",
              }}
            >
              <h2
                style={{
                  textAlign: "center",
                  fontSize: "25px",
                  color: activeFrame.color,
                  margin: "0 0 5px",
                }}
              >
                RETRO BOOTH
              </h2>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "10px",
                  letterSpacing: "2px",
                  color: activeFrame.color,
                  marginBottom: "18px",
                }}
              >
                A LITTLE MOMENT TO REMEMBER
              </p>

              {photos.map((photo, index) => (
                <div
                  key={index}
                  onPointerMove={handleStickerPointerMove}
                  onPointerUp={handleStickerPointerUp}
                  onPointerCancel={handleStickerPointerUp}
                  style={{
                    position: "relative",
                    marginBottom: "12px",
                    border: `3px ${activeFrame.borderStyle} ${activeFrame.border}`,
                    overflow: "hidden",
                    background: activeFrame.background,
                    touchAction: "none",
                  }}
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    draggable={false}
                    style={{
                      display: "block",
                      width: "100%",
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                      filter: activeFilter.css,
                      pointerEvents: "none",
                    }}
                  />

                  <span
                    onPointerDown={handleStickerPointerDown}
                    style={{
                      position: "absolute",
                      left: `${stickerPosition.x}%`,
                      top: `${stickerPosition.y}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: "35px",
                      cursor: draggingSticker ? "grabbing" : "grab",
                      touchAction: "none",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      zIndex: 5,
                      textShadow: "0 2px 5px rgba(0,0,0,0.3)",
                    }}
                    title="Drag to move sticker"
                  >
                    {selectedSticker}
                  </span>
                </div>
              ))}

              <p
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  color: activeFrame.color,
                  letterSpacing: "2px",
                  fontSize: "13px",
                  margin: "20px 0 0",
                }}
              >
                MEMORIES TO KEEP
              </p>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  color: activeFrame.color,
                  marginTop: "12px",
                  fontStyle: "italic",
                }}
              >
                ✳ Drag your sticker to move it!
              </p>
            </section>

            {/* EDITING CONTROLS */}
            <section
              style={{
                background: "#fffdf8",
                padding: "25px",
                border: "1px solid #e9dfd0",
                borderRadius: "8px",
                boxSizing: "border-box",
              }}
            >
              {/* FILTER */}
              <div style={{ marginBottom: "30px" }}>
                <h3>01. Choose Your Filter</h3>

                <p style={{ color: "#8b7869", fontSize: "13px" }}>
                  Give your pictures a vintage atmosphere.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      style={{
                        ...editorButtonStyle,
                        background:
                          selectedFilter === filter.id
                            ? "#a4493d"
                            : "#f4ede2",
                        color:
                          selectedFilter === filter.id
                            ? "#fffaf1"
                            : "#4c3528",
                        border:
                          selectedFilter === filter.id
                            ? "1px solid #a4493d"
                            : "1px solid #e5d8c5",
                      }}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>

              <hr style={editorDividerStyle} />

              {/* FRAMES */}
              <div style={{ margin: "25px 0" }}>
                <h3>02. Choose Your Frame</h3>

                <p style={{ color: "#8b7869", fontSize: "13px" }}>
                  Pick a frame that matches your mood.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "10px",
                  }}
                >
                  {frames.map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => setSelectedFrame(frame.id)}
                      style={{
                        padding: "18px 8px",
                        background: frame.background,
                        color: frame.color,
                        border:
                          selectedFrame === frame.id
                            ? "3px solid #a4493d"
                            : `2px ${frame.borderStyle} ${frame.border}`,
                        cursor: "pointer",
                        fontFamily: "Georgia",
                        fontSize: "12px",
                        transition: "0.2s",
                        borderRadius: "5px",
                      }}
                    >
                      <span style={{ fontSize: "23px" }}>▣</span>
                      <br />
                      {frame.name}
                    </button>
                  ))}
                </div>
              </div>

              <hr style={editorDividerStyle} />

              {/* STICKERS */}
              <div style={{ margin: "25px 0" }}>
                <h3>03. Add Your Sticker</h3>

                <p style={{ color: "#8b7869", fontSize: "13px" }}>
                  Add something cute to your photo strip.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  {stickers.map((sticker) => (
                    <button
                      key={sticker}
                      onClick={() => setSelectedSticker(sticker)}
                      style={{
                        width: "52px",
                        height: "52px",
                        fontSize: "25px",
                        background:
                          selectedSticker === sticker
                            ? "#f1d8cb"
                            : "#f4ede2",
                        border:
                          selectedSticker === sticker
                            ? "2px solid #a4493d"
                            : "1px solid #e5d8c5",
                        borderRadius: "50%",
                        cursor: "pointer",
                      }}
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>

              <hr style={editorDividerStyle} />

              {/* DOWNLOAD */}
              <div style={{ marginTop: "25px" }}>
                <button
                onClick={goToVisitorForm}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "#a4493d",
                  color: "#fffaf1",
                  border: "none",
                  fontFamily: "Georgia",
                  fontSize: "16px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  }}
                  >
                    Continue to Your Memories →
                    </button>

                <button
                  onClick={resetEditor}
                  style={{
                    ...editorButtonStyle,
                    width: "100%",
                    marginTop: "10px",
                  }}
                >
                  Reset All Edits
                </button>
              </div>
            </section>
          </div>
        </main>

        <footer
          style={{
            textAlign: "center",
            marginTop: "60px",
            color: "#a4493d",
            fontSize: "12px",
            letterSpacing: "2px",
          }}
        >
          ✳ MADE WITH LOVE & A LITTLE NOSTALGIA ✳
        </footer>
      </div>
    );
  }

  // ====================================
  // PHOTOBOOTH STUDIO
  // ====================================

  return (
    <div className="studio-page">
      <header className="studio-navbar">
        <button
          className="back-button"
          onClick={goHome}
          disabled={capturing}
        >
          ← Back to Home
        </button>

        <a href="#" className="brand">
          <span className="brand-icon">✳</span>
          retro<span>booth.</span>
        </a>

        <span className="studio-number">SESSION № 001</span>
      </header>

      <main className="studio-container">
        <div className="studio-heading">
          <span className="section-label">
            YOUR LITTLE PHOTO MOMENT
          </span>

          <h1>
            Strike a <span>Pose!</span>
          </h1>

          <p>
            Get ready, smile, and let us capture
            three little moments of yours.
          </p>
        </div>

        <div className="studio-layout">
          {/* CAMERA */}
          <section className="camera-card">
            <div className="camera-header">
              <span>LIVE CAMERA</span>

              <span className="camera-status">
                <span
                  className={`status-dot ${
                    stream ? "status-active" : ""
                  }`}
                ></span>

                {stream ? "CAMERA ON" : "CAMERA OFF"}
              </span>
            </div>

            <div className="camera-screen">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => setCameraReady(true)}
              />

              {!stream && (
                <div className="camera-placeholder">
                  <div className="placeholder-icon">📷</div>

                  <p>Your camera preview will appear here.</p>

                  <span>
                    Allow camera access to continue
                  </span>
                </div>
              )}

              {countdown !== null && (
                <div className="countdown-overlay">
                  {countdown}
                </div>
              )}

              {capturing && countdown === null && (
                <div className="flash-overlay"></div>
              )}

              <div className="camera-guide">
                ✳ GET READY TO SMILE ✳
              </div>
            </div>

            {cameraError && (
              <p className="camera-error">{cameraError}</p>
            )}

            <div className="camera-controls">
              {!stream ? (
                <button
                  className="primary-button"
                  onClick={startCamera}
                >
                  Enable Camera ↗
                </button>
              ) : (
                <button
                  className="primary-button"
                  onClick={startCapture}
                  disabled={!cameraReady || capturing}
                >
                  {capturing ? "Capturing..." : "Take 3 Photos 📸"}
                </button>
              )}

              <p>
                {capturing
                  ? "Please keep smiling!"
                  : "3 photos • 3 second countdown"}
              </p>

              {stream && !capturing && (
                <button
                  className="camera-off-button"
                  onClick={stopCamera}
                >
                  Turn Off Camera
                </button>
              )}
            </div>
          </section>

          {/* PHOTO STRIP */}
          <aside className="preview-card">
            <div className="preview-heading">
              <span>YOUR PHOTO STRIP</span>
              <span>{photos.length}/3</span>
            </div>

            <div className="result-strip">
              <div className="result-strip-title">
                RETRO BOOTH
              </div>

              {Array.from({ length: 3 }).map((_, index) => (
                <div className="result-photo" key={index}>
                  {photos[index] ? (
                    <img
                      src={photos[index]}
                      alt={`Captured photo ${index + 1}`}
                    />
                  ) : (
                    <div className="empty-photo">
                      <span>✳</span>
                      <p>PHOTO {index + 1}</p>
                    </div>
                  )}
                </div>
              ))}

              <div className="result-strip-footer">
                MEMORIES TO KEEP · 2026
              </div>
            </div>

            <div className="preview-progress">
              <div
                className="progress-bar"
                style={{
                  width: `${(photos.length / 3) * 100}%`,
                }}
              ></div>
            </div>

            <p className="preview-description">
              {photos.length === 3
                ? "Your photo strip is ready!"
                : "Your captured photos will appear here."}
            </p>

            {photos.length === 3 && !capturing && (
              <button
                className="primary-button download-button"
                onClick={() => setPage("editor")}
              >
                ✨ Edit Your Photo Strip
              </button>
            )}

            {photos.length > 0 && !capturing && (
              <button
                className="secondary-button retake-button"
                onClick={() => {
                  setPhotos([]);
                  setCameraError("");
                }}
              >
                Retake Photos
              </button>
            )}
          </aside>
        </div>

        <div className="studio-footer">
          <span>✳ MADE FOR MEMORIES</span>
          <span>TAKE YOUR TIME, ENJOY THE MOMENT ♡</span>
        </div>
      </main>
    </div>
  );
}

export default App;