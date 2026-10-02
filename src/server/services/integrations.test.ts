import { describe, expect, it } from "vitest";

import { MOCK_OWNER_ID, resetDatabase } from "../test/db";
import { saveDiagnostic } from "./diagnostics";
import { emitInvoice } from "./invoices";
import { generateContract } from "./contracts";

resetDatabase();

describe("saveDiagnostic", () => {
  it("persiste as seções no jsonb de diagnostics", async () => {
    const diagnostic = await saveDiagnostic(MOCK_OWNER_ID, "bk-2", {
      referencias: "Editorial de rua",
      looks: "Vestido vermelho",
      producao: "Tripé + luz natural",
      pendencias: "Confirmar permissão no parque",
    });

    expect(diagnostic.booking_id).toBe("bk-2");
    expect(diagnostic.conteudo.referencias).toBe("Editorial de rua");
    expect(diagnostic.conteudo.pendencias).toBe("Confirmar permissão no parque");
  });

  it("substitui o conteúdo existente (upsert) sem duplicar a linha", async () => {
    await saveDiagnostic(MOCK_OWNER_ID, "bk-2", {
      referencias: "primeiro",
      looks: "",
      producao: "",
      pendencias: "",
    });
    const second = await saveDiagnostic(MOCK_OWNER_ID, "bk-2", {
      referencias: "segundo",
      looks: "",
      producao: "",
      pendencias: "",
    });

    expect(second.conteudo.referencias).toBe("segundo");
    // continua uma linha única para o ensaio
  });

  it("lança not_found para ensaio inexistente", async () => {
    await expect(
      saveDiagnostic(MOCK_OWNER_ID, "nope", {
        referencias: "",
        looks: "",
        producao: "",
        pendencias: "",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("generateContract", () => {
  it("muda o contrato para gerado", async () => {
    const contract = await generateContract(MOCK_OWNER_ID, "bk-2");

    expect(contract.booking_id).toBe("bk-2");
    expect(contract.status).toBe("gerado");
  });

  it("recusa gerar contrato para ensaio cancelado", async () => {
    await expect(generateContract(MOCK_OWNER_ID, "bk-5")).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe("emitInvoice", () => {
  it("marca a nota como emitida com número e data de emissão (mock)", async () => {
    const invoice = await emitInvoice(MOCK_OWNER_ID, "bk-2");

    expect(invoice.status).toBe("emitida");
    expect(invoice.numero).toMatch(/^NF-/);
    expect(invoice.issued_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("recusa emitir nota para ensaio cancelado", async () => {
    await expect(emitInvoice(MOCK_OWNER_ID, "bk-5")).rejects.toMatchObject({ status: 400 });
  });

  it("não sobrescreve número/data de uma nota já emitida", async () => {
    const first = await emitInvoice(MOCK_OWNER_ID, "bk-2");
    const second = await emitInvoice(MOCK_OWNER_ID, "bk-2");

    expect(second.numero).toBe(first.numero);
    expect(second.issued_on).toBe(first.issued_on);
  });
});
