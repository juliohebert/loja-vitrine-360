/**
 * Script para corrigir o campo slug_catalogo na tabela configuracoes
 * 
 * O problema: Quando o slug é criado, ele salva apenas no campo 'valor',
 * mas não no campo 'slug_catalogo' (que é usado para buscar nas queries)
 */

require('dotenv').config();
const { Configuration } = require('./src/models/Schema');

async function fixSlugCatalogo() {
  try {
    console.log('🔧 Iniciando correção de slug_catalogo...\n');

    // Buscar todas as configurações de slug_catalogo
    const configs = await Configuration.findAll({
      where: {
        chave: 'slug_catalogo'
      }
    });

    console.log(`📋 Encontradas ${configs.length} configurações de slug_catalogo\n`);

    if (configs.length === 0) {
      console.log('⚠️  Nenhuma configuração de slug_catalogo encontrada');
      console.log('💡 Execute a aplicação e acesse /api/configurations/catalogo/link para gerar o slug\n');
      process.exit(0);
    }

    // Atualizar cada configuração
    let updated = 0;
    for (const config of configs) {
      const slug = config.valor;
      
      console.log(`🔍 Verificando tenant: ${config.tenant_id}`);
      console.log(`   - Valor: ${config.valor}`);
      console.log(`   - slug_catalogo: ${config.slug_catalogo}`);

      if (!config.slug_catalogo || config.slug_catalogo !== slug) {
        await config.update({
          slug_catalogo: slug
        });
        console.log(`   ✅ Atualizado! slug_catalogo agora é: ${slug}\n`);
        updated++;
      } else {
        console.log(`   ⏭️  Já está correto\n`);
      }
    }

    console.log(`\n🎉 Correção concluída!`);
    console.log(`   - Total: ${configs.length}`);
    console.log(`   - Atualizados: ${updated}`);
    console.log(`   - Já corretos: ${configs.length - updated}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao corrigir slug_catalogo:', error);
    process.exit(1);
  }
}

// Executar
fixSlugCatalogo();
