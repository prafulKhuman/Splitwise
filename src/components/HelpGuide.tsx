"use client";
import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  Stepper, Step, StepLabel, StepContent, Button, IconButton, Chip,
} from "@mui/material";
import {
  Close, PersonAdd, Login, Dashboard, Receipt, Category,
  Group, Savings, BarChart, CheckCircle, ArrowForward, ArrowBack,
} from "@mui/icons-material";

type Props = { open: boolean; onClose: () => void };

const steps = [
  {
    icon: <PersonAdd />,
    label: "अकाउंट बनाएं (Register)",
    desc: "सबसे पहले अपना अकाउंट बनाएं।",
    details: [
      "🔹 Register पेज पर जाएं",
      "🔹 अपना नाम, ईमेल और पासवर्ड डालें",
      "🔹 'Create Account' बटन दबाएं",
      "🔹 आपके ईमेल पर एक verification लिंक आएगा",
      "🔹 ईमेल खोलें और लिंक पर क्लिक करें ✅",
      "💡 Google से भी सीधे signup कर सकते हैं",
    ],
  },
  {
    icon: <Login />,
    label: "लॉगिन करें (Login)",
    desc: "ईमेल verify करने के बाद लॉगिन करें।",
    details: [
      "🔹 Login पेज पर जाएं",
      "🔹 अपना ईमेल और पासवर्ड डालें",
      "🔹 'Sign In' बटन दबाएं",
      "⚠️ अगर ईमेल verify नहीं किया तो popup आएगा",
      "💡 Popup में 'Resend Verification Email' दबाएं",
    ],
  },
  {
    icon: <Dashboard />,
    label: "डैशबोर्ड देखें (Dashboard)",
    desc: "लॉगिन के बाद डैशबोर्ड खुलेगा।",
    details: [
      "🔹 यहाँ आपकी कुल Income और Expense दिखेगी",
      "🔹 इस महीने का summary दिखेगा",
      "🔹 Recent transactions की list दिखेगी",
      "💡 Dark/Light mode TopBar से बदल सकते हैं",
    ],
  },
  {
    icon: <Category />,
    label: "कैटेगरी बनाएं (Categories)",
    desc: "पहले अपनी categories सेट करें।",
    details: [
      "🔹 साइडबार में 'Categories' पर क्लिक करें",
      "🔹 'Add Category' बटन दबाएं",
      "🔹 कैटेगरी का नाम, रंग और टाइप (Income/Expense) चुनें",
      "🔹 Fixed या Variable सेलेक्ट करें",
      "💡 जैसे: खाना, किराया, सैलरी, शॉपिंग आदि",
    ],
  },
  {
    icon: <Receipt />,
    label: "लेन-देन जोड़ें (Transactions)",
    desc: "अपनी Income और Expense यहाँ डालें।",
    details: [
      "🔹 'Transactions' पेज पर जाएं",
      "🔹 'Add Transaction' बटन दबाएं",
      "🔹 Expense या Income चुनें",
      "🔹 Title, Amount, Category और Date भरें",
      "🔹 Notes भी लिख सकते हैं (optional)",
      "💡 Split button से एक transaction को कई categories में बाँट सकते हैं",
    ],
  },
  {
    icon: <Group />,
    label: "ग्रुप बनाएं (Groups)",
    desc: "दोस्तों/परिवार के साथ खर्चा बाँटें।",
    details: [
      "🔹 'Groups' पेज पर जाएं",
      "🔹 'Create Group' बटन दबाएं",
      "🔹 ग्रुप का नाम डालें और members को ईमेल से जोड़ें",
      "🔹 ग्रुप में expense add करें",
      "🔹 किसने कितना दिया — equal/custom split करें",
      "💡 Settlement section में देखें कौन किसको कितना देना है",
    ],
  },
  {
    icon: <Savings />,
    label: "मंथली पूल (Monthly Pool)",
    desc: "हर महीने सबसे पैसे इकट्ठा करें।",
    details: [
      "🔹 'Pool' पेज पर जाएं",
      "🔹 ग्रुप सेलेक्ट करें",
      "🔹 महीना और contribution amount सेट करें",
      "🔹 Members अपना हिस्सा mark करें",
      "🔹 Pool से expenses add करें",
      "💡 जैसे: घर का किराया, बिजली बिल आदि",
    ],
  },
  {
    icon: <BarChart />,
    label: "रिपोर्ट देखें (Reports)",
    desc: "अपने खर्चे का analysis देखें।",
    details: [
      "🔹 'Reports' पेज पर जाएं",
      "🔹 महीना/साल filter करें",
      "🔹 Category-wise खर्चा chart में देखें",
      "🔹 Income vs Expense comparison देखें",
      "💡 इससे पता चलेगा कहाँ ज़्यादा खर्चा हो रहा है",
    ],
  },
];

export default function HelpGuide({ open, onClose }: Props) {
  const [activeStep, setActiveStep] = useState(0);

  const handleClose = () => { setActiveStep(0); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: "85vh" } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ background: "linear-gradient(135deg, #6C63FF, #FF6B8A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            📖 ऐप कैसे इस्तेमाल करें?
          </Typography>
          <Typography variant="caption" color="text.secondary">Step-by-step गाइड हिंदी में</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: "0 !important" }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, idx) => (
            <Step key={idx} expanded={activeStep === idx}>
              <StepLabel
                onClick={() => setActiveStep(idx)}
                sx={{ cursor: "pointer" }}
                StepIconComponent={() => (
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
                    background: activeStep === idx ? "linear-gradient(135deg, #6C63FF, #8B83FF)" : idx < activeStep ? "linear-gradient(135deg, #1DC9B7, #4DD9CB)" : "rgba(0,0,0,0.08)",
                    color: activeStep === idx || idx < activeStep ? "#fff" : "text.secondary",
                    transition: "all 0.3s",
                  }}>
                    {idx < activeStep ? <CheckCircle sx={{ fontSize: 18 }} /> : step.icon}
                  </Box>
                )}
              >
                <Typography variant="body2" fontWeight={activeStep === idx ? 700 : 500}>{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{step.desc}</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mb: 2 }}>
                  {step.details.map((d, i) => (
                    <Typography key={i} variant="body2" sx={{
                      fontSize: 13,
                      color: d.startsWith("💡") ? "#FF6B8A" : d.startsWith("⚠️") ? "#FFB822" : "text.primary",
                      fontWeight: d.startsWith("💡") || d.startsWith("⚠️") ? 600 : 400,
                    }}>
                      {d}
                    </Typography>
                  ))}
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {idx > 0 && (
                    <Button size="small" startIcon={<ArrowBack />} onClick={() => setActiveStep(idx - 1)}
                      sx={{ textTransform: "none" }}>
                      पीछे
                    </Button>
                  )}
                  {idx < steps.length - 1 ? (
                    <Button size="small" variant="contained" endIcon={<ArrowForward />} onClick={() => setActiveStep(idx + 1)}
                      sx={{ textTransform: "none", background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
                      अगला
                    </Button>
                  ) : (
                    <Button size="small" variant="contained" onClick={handleClose}
                      sx={{ textTransform: "none", background: "linear-gradient(135deg, #1DC9B7, #4DD9CB)" }}>
                      ✅ समझ गया!
                    </Button>
                  )}
                  <Chip label={`${idx + 1}/${steps.length}`} size="small" sx={{ ml: "auto", fontSize: 11, fontWeight: 600 }} />
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
    </Dialog>
  );
}
