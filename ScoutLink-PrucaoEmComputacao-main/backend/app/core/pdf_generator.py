import os
import re
from fpdf import FPDF
from app.models import Taaec

def strip_html(text: str) -> str:
    """Removes HTML tags from a given string."""
    if not text:
        return ""
    clean = re.compile('<.*?>')
    # A simple replacement for standard formatting spacing
    text = text.replace("</p>", "\n").replace("<br>", "\n")
    return re.sub(clean, '', text).strip()

def generate_taaec_pdf(taaec: Taaec) -> str:
    """
    Generates a structured and formatted PDF for the given Taaec.
    """
    pdf = FPDF()
    pdf.add_page()
    
    # Title
    pdf.set_font("Arial", size=14, style='B')
    pdf.cell(0, 8, txt="TERMO DE AUTORIZACAO DE ATIVIDADE", ln=True, align="C")
    pdf.cell(0, 8, txt="ESCOTEIRA COMPARTILHADA (TAAEC)", ln=True, align="C")
    
    pdf.ln(8)
    
    def add_section_title(title):
        pdf.set_font("Arial", size=12, style='B')
        pdf.set_fill_color(230, 230, 230)
        pdf.cell(0, 8, txt=f"  {title}", ln=True, align="L", fill=True)
        pdf.ln(2)

    def add_field(label, value):
        pdf.set_font("Arial", size=10, style='B')
        pdf.cell(0, 6, txt=label, ln=True)
        
        pdf.set_font("Arial", size=10)
        pdf.set_x(15)
        pdf.multi_cell(0, 5, txt=str(value))
        pdf.ln(2)
        
    add_section_title("1. Dados Basicos da Atividade")
    add_field("Nome da Atividade:", taaec.nome_atividade)
    add_field("UEL Responsavel:", taaec.uel_responsavel)
    
    ramos_str = ", ".join(taaec.ramos_participantes) if taaec.ramos_participantes else "Nenhum selecionado"
    add_field("Ramos Participantes:", ramos_str)
    
    pdf.set_font("Arial", size=10, style='B')
    pdf.cell(30, 6, txt="Qtd. Jovens:")
    pdf.set_font("Arial", size=10)
    pdf.cell(20, 6, txt=str(taaec.quant_jovens))
    pdf.set_font("Arial", size=10, style='B')
    pdf.cell(30, 6, txt="Qtd. Adultos:")
    pdf.set_font("Arial", size=10)
    pdf.cell(20, 6, txt=str(taaec.quant_adultos), ln=True)

    add_field("Nivel de Risco:", taaec.nivel_risco)
    
    pdf.ln(2)
    pdf.set_font("Arial", size=10, style='B')
    pdf.cell(0, 6, txt="Objetivos Educativos:", ln=True)
    pdf.set_font("Arial", size=10)
    # Strip HTML from quill
    clean_obs = strip_html(taaec.objetivos_educativos)
    pdf.multi_cell(0, 5, txt=clean_obs)
    
    pdf.ln(4)
    add_field("Local da Atividade:", taaec.local_atividade)
    add_field("URL Localizador:", taaec.url_localizador)
    
    pdf.ln(6)
    add_section_title("2. UELs Convidadas")
    if not taaec.uels_convidadas:
        pdf.set_font("Arial", size=10)
        pdf.cell(0, 6, txt="  Nenhuma UEL convidada registrada.", ln=True)
    else:
        pdf.set_font("Arial", size=10)
        for uel in taaec.uels_convidadas:
            pdf.multi_cell(0, 6, txt=f"  - {uel.nome_uel} (Responsavel: {uel.nome_responsavel})")
            
    pdf.ln(6)
    add_section_title("3. Responsaveis")
    
    pdf.set_font("Arial", size=10, style='B')
    pdf.cell(0, 6, txt="Escotista Responsavel:", ln=True)
    add_field("  Nome:", taaec.escotista_nome)
    add_field("  Email:", taaec.escotista_email)
    add_field("  Celular:", taaec.escotista_celular)

    pdf.ln(3)
    pdf.set_font("Arial", size=10, style='B')
    pdf.cell(0, 6, txt="Diretor / Autorizador da UEL:", ln=True)
    add_field("  Nome:", taaec.diretor_nome)
    add_field("  Cargo:", taaec.diretor_cargo)
    add_field("  Email:", taaec.diretor_email)
    add_field("  Celular:", taaec.diretor_celular)
    
    output_dir = "/tmp/taaec_pdfs"
    os.makedirs(output_dir, exist_ok=True)
    file_path = f"{output_dir}/taaec_{taaec.id}.pdf"
    
    pdf.output(file_path)
    return file_path
