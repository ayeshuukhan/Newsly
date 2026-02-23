## model.pt — Placeholder

This file is a placeholder for the trained PyTorch model.

### How to populate it

1. Train your model (e.g. a sentence transformer fine-tuned on news relevance).
2. Save it with:
   ```python
   import torch
   torch.save(my_model, "model.pt")
   ```
3. Replace this file with the saved `.pt` file.

### What the model receives
The `app.py` `_rank_with_pytorch()` function receives:
- A list of article dicts (title, description, url, …)
- A user interest string

Update `_rank_with_pytorch()` to match your model's actual input/output format.

### Without the model
The service falls back to **TF-IDF cosine similarity** via scikit-learn,
which still provides meaningful ranking without any trained model.
